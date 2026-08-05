import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import axios from "axios";
import {
  Archive,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Plus,
  RefreshCw,
  Save,
  X,
} from "lucide-react";

const API = axios.create({ baseURL: "https://captrack-backend.onrender.com/api" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["x-auth-token"] = token;
  return config;
});

type SemesterStatus = "Upcoming" | "Active" | "Archived";

interface SemesterItem {
  id: string;
  term: string;
  year: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline: string | null;
  groupFormationDeadline: string | null;
  proposalDeadline: string | null;
  status: SemesterStatus;
  isActive: boolean;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SemesterResponse {
  semesters: SemesterItem[];
  activeSemester: SemesterItem | null;
  stats: {
    total: number;
    active: number;
    upcoming: number;
    archived: number;
  };
}

interface SemesterForm {
  term: string;
  year: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  groupFormationDeadline: string;
  proposalDeadline: string;
  activate: boolean;
}

const emptyForm = (): SemesterForm => ({
  term: "Summer",
  year: new Date().getFullYear(),
  startDate: "",
  endDate: "",
  registrationDeadline: "",
  groupFormationDeadline: "",
  proposalDeadline: "",
  activate: false,
});

const statusStyles: Record<SemesterStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Upcoming: "bg-cyan-50 text-cyan-700",
  Archived: "bg-slate-100 text-slate-600",
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  return "An unexpected error occurred.";
}

function toInputDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-cyan-600"
      />
    </div>
  );
}

function SemesterFields({
  form,
  setForm,
  showActivate,
}: {
  form: SemesterForm;
  setForm: (form: SemesterForm) => void;
  showActivate: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Term</label>
          <select
            value={form.term}
            onChange={(event) => setForm({ ...form, term: event.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-cyan-600"
          >
            <option value="Spring">Spring</option>
            <option value="Summer">Summer</option>
            <option value="Fall">Fall</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Year</label>
          <input
            type="number"
            min={2000}
            max={2100}
            value={form.year}
            onChange={(event) => setForm({ ...form, year: Number(event.target.value) })}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-cyan-600"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DateField label="Semester start" value={form.startDate} onChange={(value) => setForm({ ...form, startDate: value })} />
        <DateField label="Semester end" value={form.endDate} onChange={(value) => setForm({ ...form, endDate: value })} />
        <DateField label="Registration deadline" value={form.registrationDeadline} onChange={(value) => setForm({ ...form, registrationDeadline: value })} />
        <DateField label="Group formation deadline" value={form.groupFormationDeadline} onChange={(value) => setForm({ ...form, groupFormationDeadline: value })} />
        <DateField label="Proposal deadline" value={form.proposalDeadline} onChange={(value) => setForm({ ...form, proposalDeadline: value })} />
      </div>

      {showActivate && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            checked={form.activate}
            onChange={(event) => setForm({ ...form, activate: event.target.checked })}
            className="mt-1 h-4 w-4 accent-cyan-700"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-800">Make this the active semester</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              The currently active semester will automatically become upcoming.
            </span>
          </span>
        </label>
      )}
    </div>
  );
}

export function AdminSemestersPage() {
  const [data, setData] = useState<SemesterResponse>({
    semesters: [],
    activeSemester: null,
    stats: { total: 0, active: 0, upcoming: 0, archived: 0 },
  });
  const [form, setForm] = useState<SemesterForm>(emptyForm);
  const [editing, setEditing] = useState<SemesterItem | null>(null);
  const [editForm, setEditForm] = useState<SemesterForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSemesters = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await API.get<SemesterResponse>("/admin/semesters");
      setData(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSemesters();
  }, [loadSemesters]);

  const orderedSemesters = useMemo(
    () =>
      [...data.semesters].sort((left, right) => {
        if (left.isActive !== right.isActive) return left.isActive ? -1 : 1;
        if (left.status !== right.status) {
          const order: Record<SemesterStatus, number> = { Active: 0, Upcoming: 1, Archived: 2 };
          return order[left.status] - order[right.status];
        }
        return right.year - left.year;
      }),
    [data.semesters]
  );

  const createSemester = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const response = await API.post<{ message: string }>("/admin/semesters", form);
      setSuccess(response.data.message);
      setForm(emptyForm());
      await loadSemesters();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (semester: SemesterItem) => {
    setEditing(semester);
    setEditForm({
      term: semester.term,
      year: semester.year,
      startDate: toInputDate(semester.startDate),
      endDate: toInputDate(semester.endDate),
      registrationDeadline: toInputDate(semester.registrationDeadline),
      groupFormationDeadline: toInputDate(semester.groupFormationDeadline),
      proposalDeadline: toInputDate(semester.proposalDeadline),
      activate: false,
    });
    setError("");
    setSuccess("");
  };

  const updateSemester = async () => {
    if (!editing) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const response = await API.patch<{ message: string }>(
        `/admin/semesters/${editing.id}`,
        editForm
      );
      setSuccess(response.data.message);
      setEditing(null);
      await loadSemesters();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (semester: SemesterItem, action: "activate" | "archive") => {
    const confirmation = action === "activate"
      ? `Make ${semester.name} the active semester?`
      : `Archive ${semester.name}? Existing project records will remain available.`;
    if (!window.confirm(confirmation)) return;

    try {
      setActionId(semester.id);
      setError("");
      setSuccess("");
      const response = await API.patch<{ message: string }>(
        `/admin/semesters/${semester.id}/${action}`
      );
      setSuccess(response.data.message);
      await loadSemesters();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setActionId("");
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-[#f3f6fa] px-8 py-8 text-sm text-slate-500">
        Loading semester management data...
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
            Administration · Academic Cycle
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Semester Management</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Create capstone semesters, configure academic deadlines, select the active cohort,
            and archive completed cycles without deleting their project records.
          </p>
        </div>

        <button
          onClick={loadSemesters}
          className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={<CalendarDays size={20} />} label="Total Semesters" value={String(data.stats.total)} subtext="All academic cycles" />
        <SummaryCard icon={<CalendarCheck size={20} />} label="Active Semester" value={data.activeSemester?.name || "None"} subtext={`${data.activeSemester?.projectCount || 0} project(s) assigned`} />
        <SummaryCard icon={<Clock3 size={20} />} label="Upcoming" value={String(data.stats.upcoming)} subtext="Prepared for future cohorts" />
        <SummaryCard icon={<Archive size={20} />} label="Archived" value={String(data.stats.archived)} subtext="Completed academic cycles" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e3a5f] text-white">
              <Plus size={19} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Create Semester</h2>
              <p className="text-sm text-slate-500">Dates can also be added later.</p>
            </div>
          </div>

          <SemesterFields form={form} setForm={setForm} showActivate />

          <button
            onClick={createSemester}
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f5f8f] px-5 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={18} />
            {saving ? "Creating semester..." : "Create Semester"}
          </button>
        </aside>

        <div className="space-y-4">
          {orderedSemesters.map((semester) => (
            <article key={semester.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[semester.status]}`}>
                      {semester.status}
                    </span>
                    {semester.isActive && (
                      <span className="rounded-full bg-[#1e3a5f] px-3 py-1 text-xs font-semibold text-white">
                        Current cohort
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-950">{semester.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {semester.projectCount} project{semester.projectCount === 1 ? "" : "s"} assigned
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openEdit(semester)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                  {!semester.isActive && (
                    <button
                      onClick={() => runAction(semester, "activate")}
                      disabled={actionId === semester.id}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      <CheckCircle2 size={16} />
                      Activate
                    </button>
                  )}
                  {!semester.isActive && semester.status !== "Archived" && (
                    <button
                      onClick={() => runAction(semester, "archive")}
                      disabled={actionId === semester.id}
                      className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      <Archive size={16} />
                      Archive
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Semester period", `${formatDate(semester.startDate)} — ${formatDate(semester.endDate)}`],
                  ["Registration deadline", formatDate(semester.registrationDeadline)],
                  ["Group formation deadline", formatDate(semester.groupFormationDeadline)],
                  ["Proposal deadline", formatDate(semester.proposalDeadline)],
                  ["Project records", String(semester.projectCount)],
                  ["Last updated", formatDate(semester.updatedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
                    <div
                      className="text-xs uppercase tracking-wide text-slate-500"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {label}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-800">{value}</div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 md:p-8">
          <div className="my-auto w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 md:px-8">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-700">Semester Configuration</div>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">Edit {editing.name}</h2>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                aria-label="Close semester editor"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8">
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}
              <SemesterFields form={editForm} setForm={setEditForm} showActivate={false} />
              <button
                onClick={updateSemester}
                disabled={saving}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f5f8f] px-5 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={18} />
                {saving ? "Saving changes..." : "Save Semester Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
