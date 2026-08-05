import { useEffect, useState } from "react";
import axios from "axios";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  ClipboardList,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["x-auth-token"] = token;
  }
  return config;
});

const groupStatusData = [
  { name: "Active", value: 18, color: "#0891b2" },
  { name: "Pending Supervisor", value: 5, color: "#f59e0b" },
  { name: "Submitted Final", value: 7, color: "#10b981" },
  { name: "Needs Review", value: 3, color: "#ef4444" },
];

const defaultWeeklySubmissions = [
  { week: "May W3", submissions: 4 },
  { week: "May W4", submissions: 9 },
  { week: "Jun W1", submissions: 6 },
  { week: "Jun W2", submissions: 14 },
  { week: "Jun W3", submissions: 8 },
];

const defaultProgressByGroup = [
  { group: "Grp 1", progress: 85 },
  { group: "Grp 2", progress: 72 },
  { group: "Grp 3", progress: 91 },
  { group: "Grp 4", progress: 48 },
  { group: "Grp 5", progress: 68 },
  { group: "Grp 6", progress: 55 },
  { group: "Grp 7", progress: 79 },
  { group: "Grp 8", progress: 33 },
];

const defaultSupervisorLoad = [
  { name: "Ahmed Adnan", groups: 3, max: 5 },
  { name: "Dr. Tasmin Jahan", groups: 4, max: 4 },
  { name: "Dr. Nazmul Karim", groups: 1, max: 3 },
  { name: "Dr. Farzana Haque", groups: 2, max: 4 },
  { name: "Md. Rafiqul Islam", groups: 2, max: 5 },
];

const defaultRecentActivity = [
  {
    time: "2h ago",
    actor: "Group 5",
    action: "submitted Sprint 1 slides to Ahmed Adnan",
    type: "submission",
  },
  {
    time: "4h ago",
    actor: "Dr. Nazmul Karim",
    action: "approved Literature Review for Group 9",
    type: "approval",
  },
  {
    time: "6h ago",
    actor: "Farida Khanam",
    action: "posted a team recruitment request on the Feed",
    type: "post",
  },
  {
    time: "1d ago",
    actor: "Dr. Farzana Haque",
    action: "updated supervision slots — 2 of 4 taken",
    type: "update",
  },
  {
    time: "1d ago",
    actor: "Group 3",
    action: "submitted Final Report for review",
    type: "submission",
  },
];

const defaultAlerts = [
  { label: "No urgent admin alerts right now.", severity: "low" },
];

const activityColors: Record<string, string> = {
  submission: "#0891b2",
  approval: "#10b981",
  post: "#8b5cf6",
  update: "#f59e0b",
};

const defaultStatCards = [
  {
    label: "Total Groups",
    value: "33",
    sub: "+4 from last semester",
    icon: <ClipboardList size={22} />,
    color: "bg-[#1e3a5f]",
  },
  {
    label: "Enrolled Students",
    value: "178",
    sub: "12 unassigned to groups",
    icon: <Users size={22} />,
    color: "bg-cyan-600",
  },
  {
    label: "Active Supervisors",
    value: "5",
    sub: "2 at full capacity",
    icon: <UserCheck size={22} />,
    color: "bg-emerald-500",
  },
  {
    label: "Needs Attention",
    value: "8",
    sub: "Overdue & pending review",
    icon: <AlertTriangle size={22} />,
    color: "bg-red-500",
  },
];

export function AdminDashboard() {
  const adminName = localStorage.getItem("userName") || "Department Admin";
  const adminEmail = localStorage.getItem("userEmail") || "admin@ewubd.edu";
  const [stats, setStats] = useState({
    totalGroups: 0,
    enrolledStudents: 0,
    activeSupervisors: 0,
    needsAttention: 0,
  });
  const [groupStatus, setGroupStatus] = useState({
    active: 0,
    pendingSupervisor: 0,
    submittedFinal: 0,
    needsReview: 0,
  });
  const [supervisorWorkload, setSupervisorWorkload] = useState(defaultSupervisorLoad);
  const [recentActivities, setRecentActivities] = useState(defaultRecentActivity);
  const [alerts, setAlerts] = useState(defaultAlerts);
  const [groupProgress, setGroupProgress] = useState(defaultProgressByGroup);
  const [weeklySubmissionData, setWeeklySubmissionData] = useState(defaultWeeklySubmissions);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const response = await API.get("/admin/dashboard");
        setStats(response.data.stats);
        setGroupStatus(response.data.groupStatus);
        setSupervisorWorkload(response.data.supervisorWorkload || []);
        setRecentActivities(response.data.recentActivity || []);
        setAlerts(response.data.alerts || defaultAlerts);
        setGroupProgress(response.data.groupProgress || []);
        setWeeklySubmissionData(response.data.weeklySubmissions || []);
      } catch (err) {
        console.error("Admin dashboard stats error:", err);
      }
    };

    fetchAdminStats();
  }, []);

  const statCards = defaultStatCards.map((card) => {
    const values: Record<string, string> = {
      "Total Groups": stats.totalGroups.toString(),
      "Enrolled Students": stats.enrolledStudents.toString(),
      "Active Supervisors": stats.activeSupervisors.toString(),
      "Needs Attention": stats.needsAttention.toString(),
    };

    return {
      ...card,
      value: values[card.label] || card.value,
    };
  });

  const dynamicGroupStatusData = groupStatusData.map((item) => {
    const values: Record<string, number> = {
      Active: groupStatus.active,
      "Pending Supervisor": groupStatus.pendingSupervisor,
      "Submitted Final": groupStatus.submittedFinal,
      "Needs Review": groupStatus.needsReview,
    };

    return {
      ...item,
      value: values[item.name] ?? item.value,
    };
  });

  return (
    <section className="min-h-screen bg-[#f3f6fa] px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <div
            className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            East West University · CSE
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Welcome, {adminName}
          </h1>

          <p className="mt-2 text-sm font-medium text-cyan-700">
            Admin Control Center · {adminEmail}
          </p>

          <p className="mt-2 text-slate-600">
            Summer 2026 Capstone Cohort · {stats.totalGroups} Active Groups
          </p>
        </div>

        <div className="relative rounded-full bg-white p-3 text-slate-600 shadow-sm">
          <Bell size={22} />
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            8
          </span>
        </div>
      </div>

      <div className="mb-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
          >
            <div className="mb-7 flex items-start justify-between">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm ${card.color}`}
              >
                {card.icon}
              </div>

              <ArrowUpRight size={18} className="text-slate-400" />
            </div>

            <div className="text-3xl font-semibold text-slate-950">
              {card.value}
            </div>

            <div className="mt-2 text-base font-medium text-slate-600">
              {card.label}
            </div>

            <div className="mt-5 text-sm font-medium text-cyan-700">
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-7 grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">
              Group Status
            </h2>

            <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-500">
              Summer 2026
            </span>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={dynamicGroupStatusData}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={95}
                dataKey="value"
                paddingAngle={4}
              >
                {dynamicGroupStatusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 12,
                  border: "1px solid #dde6f0",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {dynamicGroupStatusData.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 text-sm text-slate-600"
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ background: item.color }}
                />
                <span>{item.name}</span>
                <span className="ml-auto font-semibold text-slate-950">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">
              Weekly Submissions
            </h2>

            <TrendingUp size={19} className="text-slate-500" />
          </div>

          <ResponsiveContainer width="100%" height={285}>
            <LineChart
              data={weeklySubmissionData}
              margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#dde6f0" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12, fill: "#5a7190" }}
              />
              <YAxis tick={{ fontSize: 12, fill: "#5a7190" }} />
              <Tooltip
                formatter={(value) => [`${value}`, "Submissions"]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 12,
                  border: "1px solid #dde6f0",
                }}
              />
              <Line
                type="monotone"
                dataKey="submissions"
                stroke="#0891b2"
                strokeWidth={3}
                dot={{ r: 5, fill: "#0891b2" }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-950">
              Group Progress
            </h2>

            <TrendingUp size={19} className="text-slate-500" />
          </div>

          <ResponsiveContainer width="100%" height={285}>
            <BarChart
              data={groupProgress}
              margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#dde6f0" />
              <XAxis
                dataKey="group"
                tick={{ fontSize: 12, fill: "#5a7190" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#5a7190" }}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, "Progress"]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 12,
                  border: "1px solid #dde6f0",
                }}
              />
              <Bar dataKey="progress" radius={[6, 6, 0, 0]}>
                {groupProgress.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.progress >= 80
                        ? "#10b981"
                        : entry.progress >= 60
                          ? "#0891b2"
                          : entry.progress >= 40
                            ? "#f59e0b"
                            : "#ef4444"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-7 grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-slate-950">
            Supervisor Workload
          </h2>

          <div className="space-y-5">
            {supervisorWorkload.map((supervisor) => {
              const percentage = (supervisor.groups / supervisor.max) * 100;
              const color =
                percentage >= 100
                  ? "#ef4444"
                  : percentage >= 75
                    ? "#f59e0b"
                    : "#10b981";

              return (
                <div key={supervisor.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">
                      {supervisor.name}
                    </span>

                    <span
                      className="text-slate-500"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {supervisor.groups}/{supervisor.max}
                      {percentage >= 100 && (
                        <span className="ml-2 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                          Full
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-slate-950">
            Recent Activity
          </h2>

          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ background: activityColors[activity.type] }}
                />

                <div>
                  <p className="text-sm leading-6 text-slate-700">
                    <span className="font-semibold text-slate-950">
                      {activity.actor}
                    </span>{" "}
                    {activity.action}
                  </p>

                  <span
                    className="text-xs text-slate-500"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          <h2 className="text-xl font-semibold text-slate-950">
            Alerts & Attention Required
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{
                background:
                  alert.severity === "high"
                    ? "#fef2f2"
                    : alert.severity === "medium"
                      ? "#fffbeb"
                      : "#f0fdf4",
              }}
            >
              <ShieldCheck
                size={16}
                className={
                  alert.severity === "high"
                    ? "text-red-500"
                    : alert.severity === "medium"
                      ? "text-amber-500"
                      : "text-emerald-500"
                }
              />

              <p className="text-sm leading-6 text-slate-700">{alert.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
