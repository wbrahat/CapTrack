import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import API from "../lib/api";
import {
  CheckCircle2,
  GraduationCap,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type UserRole = "admin" | "student" | "supervisor";
type StatusFilter = "all" | "active" | "inactive";
type RoleFilter = "all" | UserRole;

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  studentId: string;
  department: string;
  createdAt: string;
  maxSupervisionSlots: number;
  assignedGroups: number;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  students: number;
  supervisors: number;
}

interface UsersResponse {
  users: ManagedUser[];
  stats: UserStats;
  currentAdminId: string;
}

const emptyStats: UserStats = {
  total: 0,
  active: 0,
  inactive: 0,
  students: 0,
  supervisors: 0,
};

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  student: "Student",
  supervisor: "Supervisor",
};

const roleStyles: Record<UserRole, string> = {
  admin: "bg-violet-50 text-violet-700",
  student: "bg-cyan-50 text-cyan-700",
  supervisor: "bg-emerald-50 text-emerald-700",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "The request could not be completed.";
  }

  return "The request could not be completed.";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [stats, setStats] = useState<UserStats>(emptyStats);
  const [currentAdminId, setCurrentAdminId] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    try {
      const response = await API.get<UsersResponse>("/admin/users", {
        params: {
          search: search.trim() || undefined,
          role: roleFilter,
          status: statusFilter,
        },
      });

      setUsers(response.data.users || []);
      setStats(response.data.stats || emptyStats);
      setCurrentAdminId(response.data.currentAdminId || "");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(fetchUsers, 250);
    return () => window.clearTimeout(timer);
  }, [fetchUsers]);

  const handleStatusChange = async (user: ManagedUser) => {
    setUpdatingId(user.id);

    try {
      const nextStatus = !user.isActive;
      const response = await API.patch(`/admin/users/${user.id}/status`, {
        isActive: nextStatus,
      });

      toast.success(response.data.message);
      await fetchUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCapacityChange = async (user: ManagedUser, change: number) => {
    const nextCapacity = Math.min(20, Math.max(1, user.maxSupervisionSlots + change));

    if (nextCapacity === user.maxSupervisionSlots) return;

    setUpdatingId(user.id);

    try {
      const response = await API.patch(
        `/admin/users/${user.id}/supervision-capacity`,
        { maxSupervisionSlots: nextCapacity },
      );

      toast.success(response.data.message);
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? { ...currentUser, maxSupervisionSlots: nextCapacity }
            : currentUser,
        ),
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  const statCards = useMemo(
    () => [
      {
        label: "Total Accounts",
        value: stats.total,
        note: "All registered users",
        icon: <Users size={21} />,
      },
      {
        label: "Active Accounts",
        value: stats.active,
        note: `${stats.inactive} currently inactive`,
        icon: <CheckCircle2 size={21} />,
      },
      {
        label: "Students",
        value: stats.students,
        note: "Capstone participants",
        icon: <GraduationCap size={21} />,
      },
      {
        label: "Supervisors",
        value: stats.supervisors,
        note: "Faculty supervisors",
        icon: <UserCheck size={21} />,
      },
    ],
    [stats],
  );

  return (
    <section className="min-h-screen bg-[#f3f6fa] px-6 py-8 xl:px-8">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div
            className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-500"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Administration · Account Control
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            User Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review registered accounts, control access, and manage each supervisor&apos;s
            maximum supervision capacity.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              {card.icon}
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.note}</p>
          </article>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_190px_190px]">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, student ID, or department..."
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          >
            <option value="all">All roles</option>
            <option value="student">Students</option>
            <option value="supervisor">Supervisors</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e3a5f] text-white">
              <UserCog size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Registered Users</h2>
              <p className="text-sm text-slate-500">{users.length} account(s) match the current filters.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading user accounts...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No user account matches these filters.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => {
              const isCurrentAdmin = user.id === currentAdminId;
              const isUpdating = updatingId === user.id;

              return (
                <article key={user.id} className="p-5 xl:p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                        {initials(user.name)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-slate-950">{user.name}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[user.role]}`}>
                            {roleLabels[user.role]}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              user.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                          {isCurrentAdmin && (
                            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                              Your account
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-sm text-slate-600">{user.email}</p>
                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                          <span>{user.department}</span>
                          {user.studentId && <span>ID: {user.studentId}</span>}
                          <span>Joined {formatDate(user.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
                      {user.role === "supervisor" && (
                        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:min-w-[250px]">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Supervision Capacity
                            </p>
                            <p className="mt-1 text-sm text-slate-700">
                              {user.assignedGroups} assigned · {user.maxSupervisionSlots} maximum
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label="Reduce supervision capacity"
                              disabled={isUpdating || user.maxSupervisionSlots <= 1}
                              onClick={() => handleCapacityChange(user, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40"
                            >
                              <Minus size={15} />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-slate-900">
                              {user.maxSupervisionSlots}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase supervision capacity"
                              disabled={isUpdating || user.maxSupervisionSlots >= 20}
                              onClick={() => handleCapacityChange(user, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40"
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isUpdating || isCurrentAdmin}
                        onClick={() => handleStatusChange(user)}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${
                          user.isActive
                            ? "border border-red-200 bg-red-50 text-red-700"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {user.isActive ? <XCircle size={17} /> : <ShieldCheck size={17} />}
                        {isUpdating
                          ? "Updating..."
                          : user.isActive
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
