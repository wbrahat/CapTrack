import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import axios from "axios";
import API from "../lib/api";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Save,
  Search,
  Users,
  X,
} from "lucide-react";

type SubmissionItem = {
  id: string;
  title: string;
  file: string;
  type: string;
  status: string;
  feedback: string;
  submittedBy: string;
  date: string;
};

type ProjectItem = {
  id: string;
  title: string;
  description: string;
  groupName: string;
  domain: string;
  semester: string;
  supervisor: string;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  displayStatus: string;
  progress: number;
  members: number;
  createdAt: string;
  updatedAt: string;
  lastUpdate: string;
  student: null | {
    id: string;
    name: string;
    email: string;
    studentId: string;
  };
  submissionSummary: {
    total: number;
    pending: number;
    revision: number;
    approved: number;
  };
  latestSubmission: null | {
    id: string;
    title: string;
    file: string;
    type: string;
    status: string;
    submittedBy: string;
    date: string;
  };
  submissions: SubmissionItem[];
  needsAttention: boolean;
  attention: string;
};

type SupervisorItem = {
  id: string;
  name: string;
  email: string;
  maxSupervisionSlots: number;
  assignedGroups: number;
};

type SemesterItem = {
  id: string;
  name: string;
  status: "Upcoming" | "Active" | "Archived";
  isActive: boolean;
};

type ProjectResponse = {
  projects: ProjectItem[];
  stats: {
    total: number;
    active: number;
    completed: number;
    needsAttention: number;
  };
  supervisors: SupervisorItem[];
  semesters: SemesterItem[];
  activeSemester: SemesterItem | null;
};

type EditForm = {
  title: string;
  description: string;
  groupName: string;
  domain: string;
  semester: string;
  status: ProjectItem["status"];
  progress: number;
  members: number;
  supervisorId: string;
};

const statusStyles: Record<string, string> = {
  Active: "bg-blue-50 text-blue-700",
  Completed: "bg-emerald-50 text-emerald-700",
  "Pending Approval": "bg-amber-50 text-amber-700",
  Rejected: "bg-red-50 text-red-700",
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

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  return "An unexpected error occurred.";
}

function quoteCsv(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

export function AllProjectsPage() {
  const [data, setData] = useState<ProjectResponse>({
    projects: [],
    stats: { total: 0, active: 0, completed: 0, needsAttention: 0 },
    supervisors: [],
    semesters: [],
    activeSemester: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [supervisorFilter, setSupervisorFilter] = useState("All Supervisors");
  const [domainFilter, setDomainFilter] = useState("All Domains");
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await API.get<ProjectResponse>("/admin/projects");
      setData(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const domains = useMemo(
    () => ["All Domains", ...Array.from(new Set(data.projects.map((item) => item.domain))).sort()],
    [data.projects]
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.projects.filter((project) => {
      const matchesSearch =
        !query ||
        [
          project.title,
          project.groupName,
          project.domain,
          project.supervisor,
          project.student?.name,
          project.student?.email,
          project.attention,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All Status" || project.displayStatus === statusFilter;
      const matchesSupervisor =
        supervisorFilter === "All Supervisors" || project.supervisor === supervisorFilter;
      const matchesDomain = domainFilter === "All Domains" || project.domain === domainFilter;

      return matchesSearch && matchesStatus && matchesSupervisor && matchesDomain;
    });
  }, [data.projects, domainFilter, search, statusFilter, supervisorFilter]);

  const openProject = (project: ProjectItem) => {
    const matchedSupervisor = data.supervisors.find(
      (supervisor) =>
        supervisor.name.toLowerCase() === project.supervisor.toLowerCase() ||
        supervisor.email.toLowerCase() === project.supervisor.toLowerCase()
    );

    setSelectedProject(project);
    setForm({
      title: project.title,
      description: project.description,
      groupName: project.groupName,
      domain: project.domain,
      semester: project.semester,
      status: project.status,
      progress: project.progress,
      members: project.members,
      supervisorId: matchedSupervisor?.id || "unassigned",
    });
    setError("");
    setSuccess("");
  };

  const closeProject = () => {
    setSelectedProject(null);
    setForm(null);
    setError("");
    setSuccess("");
  };

  const saveProject = async () => {
    if (!selectedProject || !form) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const response = await API.patch<{ message: string; project: ProjectItem }>(
        `/admin/projects/${selectedProject.id}`,
        form
      );

      const updated = response.data.project;
      setData((current) => {
        const projects = current.projects.map((item) =>
          item.id === updated.id ? updated : item
        );
        return {
          ...current,
          projects,
          stats: {
            total: projects.length,
            active: projects.filter((item) => item.displayStatus === "Active").length,
            completed: projects.filter((item) => item.displayStatus === "Completed").length,
            needsAttention: projects.filter((item) => item.needsAttention).length,
          },
          supervisors: current.supervisors.map((supervisor) => ({
            ...supervisor,
            assignedGroups: projects.filter(
              (project) => project.supervisor === supervisor.name || project.supervisor === supervisor.email
            ).length,
          })),
        };
      });
      setSelectedProject(updated);
      setForm((current) =>
        current
          ? {
              ...current,
              status: updated.status,
              progress: updated.progress,
              members: updated.members,
            }
          : current
      );
      setSuccess(response.data.message || "Project updated successfully.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const generateReport = () => {
    const rows = [
      [
        "Project Title",
        "Group",
        "Student",
        "Student Email",
        "Supervisor",
        "Status",
        "Progress",
        "Members",
        "Domain",
        "Semester",
        "Submissions",
        "Attention",
      ],
      ...filteredProjects.map((project) => [
        project.title,
        project.groupName,
        project.student?.name || "Student record missing",
        project.student?.email || "",
        project.supervisor,
        project.displayStatus,
        `${project.progress}%`,
        project.members,
        project.domain,
        project.semester,
        project.submissionSummary.total,
        project.attention,
      ]),
    ];

    const csv = rows.map((row) => row.map(quoteCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `captrack-project-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-[#f3f6fa] px-8 py-8 text-sm text-slate-500">
        Loading project management data...
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#f3f6fa] px-5 py-7 md:px-8 md:py-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div
            className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            CapTrack - Admin
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">All Projects</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Review every capstone project, open complete project details, assign supervisors,
            approve proposals, and update progress from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={loadProjects}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
          <button
            onClick={generateReport}
            className="flex items-center gap-2 rounded-full bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white shadow-sm"
          >
            <Download size={17} />
            Generate Report
          </button>
        </div>
      </div>

      {error && !selectedProject && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={<BarChart3 size={20} />} label="Total Projects" value={String(data.stats.total)} subtext="All database projects" />
        <SummaryCard icon={<Clock size={20} />} label="Active Projects" value={String(data.stats.active)} subtext="Approved and in progress" />
        <SummaryCard icon={<CheckCircle2 size={20} />} label="Completed" value={String(data.stats.completed)} subtext="100% or marked completed" />
        <SummaryCard icon={<AlertCircle size={20} />} label="Needs Attention" value={String(data.stats.needsAttention)} subtext="Approval, assignment, or revision" />
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_210px_180px]">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search project, group, student, or supervisor..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Pending Approval</option>
            <option>Completed</option>
            <option>Rejected</option>
          </select>

          <select
            value={supervisorFilter}
            onChange={(event) => setSupervisorFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          >
            <option>All Supervisors</option>
            <option>Not Assigned Yet</option>
            {data.supervisors.map((supervisor) => (
              <option key={supervisor.id}>{supervisor.name}</option>
            ))}
          </select>

          <select
            value={domainFilter}
            onChange={(event) => setDomainFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          >
            {domains.map((domain) => (
              <option key={domain}>{domain}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              No projects match the current filters.
            </div>
          ) : (
            filteredProjects.map((project) => (
              <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[project.displayStatus] || "bg-slate-100 text-slate-700"}`}>
                        {project.displayStatus}
                      </span>
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{project.domain}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{project.groupName}</span>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-950">{project.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Last update: {project.lastUpdate || "No update recorded"}
                    </p>
                  </div>

                  <button
                    onClick={() => openProject(project)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#0f5f8f] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <Eye size={16} />
                    View & Manage
                  </button>
                </div>

                <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoItem label="Supervisor" value={project.supervisor} />
                  <InfoItem label="Student" value={project.student?.name || "Student record missing"} />
                  <InfoItem label="Members" value={`${project.members} member${project.members === 1 ? "" : "s"}`} />
                  <InfoItem label="Attention" value={project.attention} />
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">Project Progress</span>
                    <span className="font-semibold text-cyan-700">{project.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-cyan-600" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-1 text-xs uppercase tracking-wide text-slate-500" style={{ fontFamily: "'DM Mono', monospace" }}>Submissions</div>
                    <div className="text-sm font-medium text-slate-800">{project.submissionSummary.total} tracked</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-1 text-xs uppercase tracking-wide text-slate-500" style={{ fontFamily: "'DM Mono', monospace" }}>Latest File</div>
                    <div className="truncate text-sm font-medium text-slate-800">{project.latestSubmission?.file || project.latestSubmission?.title || "No submission yet"}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-1 text-xs uppercase tracking-wide text-slate-500" style={{ fontFamily: "'DM Mono', monospace" }}>Semester</div>
                    <div className="text-sm font-medium text-slate-800">{project.semester}</div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-950">Admin Attention</h3>
            </div>
            <div className="space-y-3">
              {data.projects.filter((item) => item.needsAttention).length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">No urgent project issues.</p>
              ) : (
                data.projects.filter((item) => item.needsAttention).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openProject(item)}
                    className="w-full rounded-xl bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    <div className="mt-1">{item.attention}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">Supervisor Distribution</h3>
            </div>
            <div className="space-y-3">
              {data.supervisors.map((supervisor) => (
                <div key={supervisor.id} className="rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-800">{supervisor.name}</span>
                    <span className="text-xs font-semibold text-cyan-700">
                      {supervisor.assignedGroups} / {supervisor.maxSupervisionSlots}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                    <div
                      className="h-1.5 rounded-full bg-cyan-600"
                      style={{ width: `${Math.min((supervisor.assignedGroups / Math.max(supervisor.maxSupervisionSlots, 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {selectedProject && form && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 md:p-8">
          <div className="my-auto w-full max-w-5xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 md:px-8">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-700">Admin Project Control</div>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">Project Details</h2>
              </div>
              <button onClick={closeProject} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200" aria-label="Close project details">
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-7 p-6 md:p-8 xl:grid-cols-[1fr_330px]">
              <div className="space-y-5">
                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Project title</label>
                  <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-600" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                  <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-600" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Group name</label>
                    <input value={form.groupName} onChange={(event) => setForm({ ...form, groupName: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-600" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Research domain</label>
                    <input value={form.domain} onChange={(event) => setForm({ ...form, domain: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-600" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Semester</label>
                    <select
                      value={form.semester}
                      onChange={(event) => setForm({ ...form, semester: event.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600"
                    >
                      {data.semesters
                        .filter((semester) => semester.status !== "Archived" || semester.name === form.semester)
                        .map((semester) => (
                          <option key={semester.id} value={semester.name}>
                            {semester.name}{semester.isActive ? " (Active)" : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Members</label>
                    <input type="number" min={1} max={20} value={form.members} onChange={(event) => setForm({ ...form, members: Number(event.target.value) })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-600" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Project status</label>
                    <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectItem["status"] })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600">
                      <option value="Pending">Pending approval</option>
                      <option value="Approved">Approved / active</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Assigned supervisor</label>
                    <select value={form.supervisorId} onChange={(event) => setForm({ ...form, supervisorId: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600">
                      <option value="unassigned">Not Assigned Yet</option>
                      {data.supervisors.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.name} ({supervisor.assignedGroups}/{supervisor.maxSupervisionSlots})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Project progress</label>
                    <span className="font-semibold text-cyan-700">{form.progress}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={form.progress} onChange={(event) => setForm({ ...form, progress: Number(event.target.value) })} className="w-full accent-cyan-700" />
                </div>

                <button onClick={saveProject} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f5f8f] px-5 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                  <Save size={18} />
                  {saving ? "Saving changes..." : "Save Project Changes"}
                </button>
              </div>

              <aside className="space-y-5">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <h3 className="font-semibold text-slate-950">Student record</h3>
                  {selectedProject.student ? (
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <div className="font-medium text-slate-900">{selectedProject.student.name}</div>
                      <div>{selectedProject.student.email}</div>
                      <div>{selectedProject.student.studentId || "Student ID not provided"}</div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
                      This project references a student account that is missing from the database.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center gap-2">
                    <FileText size={17} className="text-cyan-700" />
                    <h3 className="font-semibold text-slate-950">Submission history</h3>
                  </div>
                  <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                    {selectedProject.submissions.length === 0 ? (
                      <div className="rounded-xl bg-white px-3 py-3 text-sm text-slate-500">No submissions recorded.</div>
                    ) : (
                      selectedProject.submissions.map((submission) => (
                        <div key={submission.id} className="rounded-xl bg-white p-3 text-sm">
                          <div className="font-semibold text-slate-900">{submission.title}</div>
                          <div className="mt-1 text-slate-500">{submission.submittedBy} · {submission.date}</div>
                          <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{submission.status}</div>
                          {submission.feedback && <div className="mt-2 text-slate-600">Feedback: {submission.feedback}</div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
