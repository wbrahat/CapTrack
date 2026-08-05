/**
 * StudentDashboard.tsx  —  CapTrack Redesign
 *
 * Three-column hub layout:
 *   LEFT   – Profile Snapshot (read-only, synced from /auth/me)
 *   CENTER – Project Summary Widget (hasProject: true / false)
 *   RIGHT  – Activity Log & Notification Feed
 *
 * All API calls are defensive: optional chaining + safe defaults throughout.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import {
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FolderOpen,
  Loader2,
  Mail,
  Pencil,
  RefreshCw,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-react";

// ─── API instance ─────────────────────────────────────────────────────────────

const API = axios.create({ baseURL: "http://localhost:5000/api" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["x-auth-token"] = token;
  return config;
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  name: string;
  email: string;
  role: string;
  profileSettings?: { department?: string; institution?: string };
  cgpa: number | string;
  credits: number;
  capstoneSemester: string;
  skills: string[];
  teamStatus: string;
  researchInterest: string;
}

interface Milestone {
  label: string;
  due: string;
  status: "done" | "active" | "upcoming";
}

interface DashboardData {
  hasProject?: boolean;
  user?: { name: string; group: string; supervisor: string; term: string };
  stats?: {
    progress: number;
    submissions: number;
    lastSubmissionDate: string;
    tasksCompleted: string;
  };
  milestones?: Milestone[];
  projectTitle?: string;
}

interface ActivityNotification {
  id: string;
  type: "team_invite" | "supervisor_msg" | "system";
  title: string;
  body: string;
  senderName: string;
  senderAvatar: string;
  status: "unread" | "read";
  actionStatus: "pending" | "accepted" | "declined" | "none";
  link: string;
  timeLabel: string;
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function initials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "CT"
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Pulsing skeleton block */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-secondary ${className}`}
      aria-hidden="true"
    />
  );
}

/** Single skill badge */
function SkillBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: "rgba(8,145,178,0.1)",
        color: "#0891b2",
        border: "1px solid rgba(8,145,178,0.2)",
      }}
    >
      {label}
    </span>
  );
}

/** Milestone status row */
const milestoneIcon: Record<string, React.ReactNode> = {
  done: <CheckCircle2 size={14} style={{ color: "#10b981" }} />,
  active: <Clock size={14} style={{ color: "#0891b2" }} />,
  upcoming: <Clock size={14} style={{ color: "#94a3b8" }} />,
};

function MilestoneRow({ m }: { m: Milestone }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex-shrink-0">
        {milestoneIcon[m.status] ?? milestoneIcon.upcoming}
      </span>
      <span
        className="flex-1 truncate"
        style={{
          color:
            m.status === "upcoming"
              ? "var(--muted-foreground)"
              : "var(--foreground)",
        }}
      >
        {m.label}
      </span>
      <span
        className="text-xs flex-shrink-0"
        style={{
          color: "var(--muted-foreground)",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {m.due}
      </span>
    </div>
  );
}

// ─── Panel 1: Profile Snapshot ────────────────────────────────────────────────

function ProfileSnapshot({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await API.get("/auth/me");
      setProfile(data);
    } catch {
      setError("Couldn't load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const teamStatusLabel =
    profile?.teamStatus === "In a Team"
      ? "In a Team"
      : profile?.teamStatus === "Open"
      ? "Looking for Team"
      : "Not Set";

  const teamStatusStyle =
    profile?.teamStatus === "In a Team"
      ? {
          background: "rgba(16,185,129,0.1)",
          color: "#065f46",
          border: "1px solid rgba(16,185,129,0.2)",
        }
      : profile?.teamStatus === "Open"
      ? {
          background: "rgba(8,145,178,0.1)",
          color: "#0891b2",
          border: "1px solid rgba(8,145,178,0.2)",
        }
      : {
          background: "var(--secondary)",
          color: "var(--muted-foreground)",
          border: "1px solid var(--border)",
        };

  return (
    <section
      className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden"
      style={{ minHeight: 0 }}
    >
      {/* card header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Shield size={16} style={{ color: "#0891b2" }} />
          <span className="text-sm font-medium text-foreground">
            My Profile
          </span>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: "rgba(8,145,178,0.08)", color: "#0891b2" }}
        >
          Public view
        </span>
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
            <div className="flex gap-2 flex-wrap pt-1">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-5 w-16 rounded-full" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={load}
              className="mt-2 text-xs flex items-center gap-1 mx-auto"
              style={{ color: "#0891b2" }}
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : profile ? (
          <>
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0 select-none"
                style={{
                  background:
                    "linear-gradient(135deg, #1e3a5f 0%, #0891b2 100%)",
                  color: "#fff",
                  letterSpacing: "0.05em",
                }}
              >
                {initials(profile.name)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate text-base leading-tight">
                  {profile.name || "—"}
                </p>
                <p
                  className="text-xs mt-0.5 truncate"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {profile?.profileSettings?.department ||
                    "Computer Science & Engineering"}
                </p>
                {/* Team status badge */}
                <span
                  className="inline-flex items-center mt-1.5 gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={teamStatusStyle}
                >
                  <Users size={10} />
                  {teamStatusLabel}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "var(--border)" }} />

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "CGPA",
                  value:
                    profile.cgpa != null && profile.cgpa !== ""
                      ? String(profile.cgpa)
                      : "—",
                  icon: <BookOpen size={14} />,
                },
                {
                  label: "Credits",
                  value:
                    profile.credits != null && profile.credits !== 0
                      ? `${profile.credits} cr`
                      : "—",
                  icon: <Zap size={14} />,
                },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="rounded-xl px-3 py-2.5 flex flex-col gap-1"
                  style={{ background: "var(--secondary)" }}
                >
                  <div
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {icon}
                    {label}
                  </div>
                  <span className="font-semibold text-sm text-foreground leading-none">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Target semester */}
            {profile.capstoneSemester && (
              <div className="flex items-center gap-2 text-sm">
                <BriefcaseBusiness
                  size={14}
                  style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
                />
                <span style={{ color: "var(--muted-foreground)" }}>Target:</span>
                <span className="text-foreground font-medium">
                  {profile.capstoneSemester}
                </span>
              </div>
            )}

            {/* Skills */}
            {(profile?.skills ?? []).length > 0 && (
              <div>
                <p
                  className="text-xs mb-2 font-medium uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.skills || []).map((s) => (
                    <SkillBadge key={s} label={s} />
                  ))}
                </div>
              </div>
            )}

            {(profile?.skills ?? []).length === 0 && !profile.capstoneSemester && (
              <p
                className="text-xs text-center py-2"
                style={{ color: "var(--muted-foreground)" }}
              >
                Complete your profile so teammates can find you.
              </p>
            )}
          </>
        ) : null}
      </div>

      {/* footer CTA */}
      <div
        className="px-5 py-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button
          onClick={() => onNavigate("settings")}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-opacity hover:opacity-80 cursor-pointer"
          style={{ background: "var(--secondary)", color: "var(--primary)" }}
        >
          <Pencil size={14} />
          Edit Profile
        </button>
      </div>
    </section>
  );
}

// ─── Panel 2: Project Summary Widget ─────────────────────────────────────────

function ProjectWidget({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data: d } = await API.get("/projects/dashboard/student");
      setData(d);
    } catch {
      setError("Couldn't load project data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const milestones = data?.milestones ?? [];
  const stats = data?.stats;
  const progress = stats?.progress ?? 0;

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
      {/* header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <FolderOpen size={16} style={{ color: "#0891b2" }} />
          <span className="text-sm font-medium text-foreground">
            Project Summary
          </span>
        </div>
        {!loading && !error && data?.hasProject && (
          <span
            className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: "rgba(16,185,129,0.1)", color: "#065f46" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Active
          </span>
        )}
      </div>

      {/* body */}
      <div className="flex-1 px-5 py-5 flex flex-col gap-5 overflow-y-auto">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-3">
            <FolderOpen
              size={32}
              style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
            />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {error}
            </p>
            <button
              onClick={load}
              className="text-xs flex items-center gap-1"
              style={{ color: "#0891b2" }}
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : data?.hasProject === false ? (
          /* Empty state: no project assigned */
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(8,145,178,0.08)" }}
            >
              <FolderOpen size={28} style={{ color: "#0891b2" }} />
            </div>
            <div>
              <p className="font-medium text-foreground text-base">
                No Project Assigned Yet
              </p>
              <p
                className="mt-1.5 text-sm leading-relaxed max-w-xs mx-auto"
                style={{ color: "var(--muted-foreground)" }}
              >
                Project group is not assigned yet. Your project summary will
                appear here once you are assigned to a team.
              </p>
            </div>
            <button
              onClick={() => onNavigate("supervisors")}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 cursor-pointer"
              style={{ background: "#0891b2", color: "#fff" }}
            >
              Browse Supervisors <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          /* Project assigned state */
          <>
            {/* project meta */}
            <div>
              <h2
                className="text-lg font-semibold text-foreground leading-tight"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {data?.user?.group
                  ? `${data.user.group} — Capstone Project`
                  : "Capstone Project"}
              </h2>
              <div
                className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                <span className="flex items-center gap-1">
                  <Users size={13} /> {data?.user?.group ?? "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Shield size={13} /> {data?.user?.supervisor ?? "Pending"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={13} /> {data?.user?.term ?? "—"}
                </span>
              </div>
            </div>

            {/* progress bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Overall Progress
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {progress}%
                </span>
              </div>
              <div
                className="h-2 w-full rounded-full overflow-hidden"
                style={{ background: "var(--secondary)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg, #1e3a5f 0%, #0891b2 100%)",
                  }}
                />
              </div>
            </div>

            {/* stats row */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Submissions",
                  value: String(stats?.submissions ?? 0),
                  icon: <BookOpen size={14} />,
                },
                {
                  label: "Tasks Done",
                  value: stats?.tasksCompleted ?? "0 / 0",
                  icon: <CheckCircle2 size={14} />,
                },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="rounded-xl px-3 py-2.5"
                  style={{ background: "var(--secondary)" }}
                >
                  <div
                    className="flex items-center gap-1 text-xs mb-1"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {icon} {label}
                  </div>
                  <span className="font-semibold text-sm text-foreground">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* last 4 milestones */}
            {milestones.length > 0 && (
              <div>
                <p
                  className="text-xs mb-2.5 font-medium uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Milestones
                </p>
                <div className="space-y-2">
                  {milestones.slice(0, 4).map((m) => (
                    <MilestoneRow key={m.label} m={m} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* footer */}
      {!loading && !error && data?.hasProject && (
        <div
          className="px-5 py-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={() => onNavigate("workspace")}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-opacity hover:opacity-80 cursor-pointer"
            style={{ background: "#0891b2", color: "#fff" }}
          >
            Go to Project Workspace <ExternalLink size={14} />
          </button>
        </div>
      )}
    </section>
  );
}

// ─── Panel 3: Activity Log ────────────────────────────────────────────────────

const activityIcons: Record<ActivityNotification["type"], React.ReactNode> = {
  team_invite: <Users size={14} style={{ color: "#0891b2" }} />,
  supervisor_msg: <Mail size={14} style={{ color: "#8b5cf6" }} />,
  system: <Bell size={14} style={{ color: "#f59e0b" }} />,
};

const activityColors: Record<ActivityNotification["type"], string> = {
  team_invite: "rgba(8,145,178,0.1)",
  supervisor_msg: "rgba(139,92,246,0.1)",
  system: "rgba(245,158,11,0.1)",
};

function NotificationCard({
  note,
  onRead,
  onAction,
}: {
  note: ActivityNotification;
  onRead: (id: string) => void;
  onAction: (id: string, action: "accept" | "decline") => void;
}) {
  const [busy, setBusy] = useState(false);

  const handleAction = async (action: "accept" | "decline") => {
    setBusy(true);
    await onAction(note.id, action);
    setBusy(false);
  };

  const isUnread = note.status === "unread";
  const isPending = note.actionStatus === "pending";

  return (
    <div
      className={`rounded-xl p-3.5 transition-colors ${
        isUnread ? "ring-1 ring-inset" : ""
      }`}
      style={{
        background: isUnread ? "rgba(8,145,178,0.04)" : "var(--secondary)",
        ringColor: isUnread ? "rgba(8,145,178,0.15)" : "transparent",
        border: `1px solid ${
          isUnread ? "rgba(8,145,178,0.18)" : "var(--border)"
        }`,
      }}
    >
      <div className="flex gap-3">
        {/* avatar / type icon */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 select-none"
          style={{
            background: activityColors[note.type],
          }}
        >
          {note.senderAvatar || activityIcons[note.type]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className="text-sm leading-snug text-foreground"
              style={{ fontWeight: isUnread ? 500 : 400 }}
            >
              {note.title}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="text-xs whitespace-nowrap"
                style={{
                  color: "var(--muted-foreground)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {note.timeLabel}
              </span>
              {isUnread && (
                <button
                  onClick={() => onRead(note.id)}
                  title="Mark as read"
                  className="opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X size={12} style={{ color: "var(--muted-foreground)" }} />
                </button>
              )}
            </div>
          </div>

          {note.body && (
            <p
              className="text-xs mt-0.5 leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              {note.body}
            </p>
          )}

          {/* unread dot */}
          {isUnread && (
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mt-1"
              style={{ background: "#0891b2" }}
            />
          )}

          {/* team invite action buttons */}
          {note.type === "team_invite" && isPending && (
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={() => handleAction("accept")}
                disabled={busy}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 cursor-pointer"
                style={{ background: "#0891b2", color: "#fff" }}
              >
                {busy ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Check size={11} />
                )}
                Accept
              </button>
              <button
                onClick={() => handleAction("decline")}
                disabled={busy}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 cursor-pointer"
                style={{
                  background: "var(--secondary)",
                  color: "var(--destructive)",
                  border: "1px solid rgba(212,24,61,0.2)",
                }}
              >
                {busy ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <X size={11} />
                )}
                Decline
              </button>
            </div>
          )}

          {/* resolved state */}
          {note.type === "team_invite" &&
            !isPending &&
            note.actionStatus !== "none" && (
              <span
                className="inline-flex items-center gap-1 mt-2 text-xs px-2 py-0.5 rounded-full"
                style={
                  note.actionStatus === "accepted"
                    ? { background: "rgba(16,185,129,0.1)", color: "#065f46" }
                    : { background: "rgba(212,24,61,0.08)", color: "#b91c1c" }
                }
              >
                {note.actionStatus === "accepted" ? (
                  <>
                    <Check size={10} /> Accepted
                  </>
                ) : (
                  <>
                    <X size={10} /> Declined
                  </>
                )}
              </span>
            )}
        </div>
      </div>
    </div>
  );
}

function ActivityFeed() {
  const [notes, setNotes] = useState<ActivityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnread] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const INITIAL_LIMIT = 3;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await API.get("/activity");
      setNotes(data?.notifications ?? []);
      const unread = (data?.notifications ?? []).filter(
        (n: ActivityNotification) => n.status === "unread"
      ).length;
      setUnread(unread);
    } catch {
      setError("Couldn't load activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    try {
      const { data } = await API.put(`/activity/${id}/read`);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? data.notification : n))
      );
      setUnread((c) => Math.max(0, c - 1));
    } catch {
      /* silent */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await API.put("/activity/read-all");
      setNotes((prev) => prev.map((n) => ({ ...n, status: "read" as const })));
      setUnread(0);
    } catch {
      /* silent */
    }
  }, []);

  const handleAction = useCallback(
    async (id: string, action: "accept" | "decline") => {
      try {
        const { data } = await API.put(`/activity/${id}/action`, { action });
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? data.notification : n))
        );
        setUnread((c) =>
          notes.find((n) => n.id === id)?.status === "unread"
            ? Math.max(0, c - 1)
            : c
        );
      } catch {
        /* silent */
      }
    },
    [notes]
  );

  const visibleNotes = expanded ? notes : notes.slice(0, INITIAL_LIMIT);

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
      {/* header */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Bell size={16} style={{ color: "#0891b2" }} />
          <span className="text-sm font-medium text-foreground">
            Activity Log
          </span>
          {unreadCount > 0 && (
            <span
              className="text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
              style={{ background: "#0891b2", color: "#fff" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70 cursor-pointer"
              style={{ color: "#0891b2" }}
            >
              <CheckCircle2 size={12} /> Mark all read
            </button>
          )}
          <button
            onClick={load}
            className="transition-opacity hover:opacity-70 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={14} style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>
      </div>

      {/* scrollable feed */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
        style={{ minHeight: 0 }}
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 items-start">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {error}
            </p>
            <button
              onClick={load}
              className="mt-2 text-xs flex items-center gap-1 mx-auto"
              style={{ color: "#0891b2" }}
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(8,145,178,0.06)" }}
            >
              <Bell size={24} style={{ color: "rgba(8,145,178,0.5)" }} />
            </div>
            <p className="text-sm font-medium text-foreground">
              All caught up
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              No new activities to show.
            </p>
          </div>
        ) : (
          <>
            {visibleNotes.map((note) => (
              <NotificationCard
                key={note.id}
                note={note}
                onRead={markRead}
                onAction={handleAction}
              />
            ))}

            {notes.length > INITIAL_LIMIT && (
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="w-full flex items-center justify-center gap-1.5 py-2 mt-2 text-xs font-medium rounded-xl border border-border transition-colors hover:bg-secondary/80 cursor-pointer"
                style={{ background: "var(--secondary)", color: "#0891b2" }}
              >
                {expanded ? (
                  <>
                    Show Less <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    View More ({notes.length - INITIAL_LIMIT} older activities){" "}
                    <ChevronDown size={14} />
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* legend */}
      {!loading && notes.length > 0 && (
        <div
          className="px-5 py-3 flex items-center gap-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {(
            [
              { type: "team_invite", label: "Team Invite" },
              { type: "supervisor_msg", label: "Supervisor" },
              { type: "system", label: "System" },
            ] as { type: ActivityNotification["type"]; label: string }[]
          ).map(({ type, label }) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: activityColors[type] }}
              >
                {activityIcons[type]}
              </div>
              <span
                className="text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Dashboard header bar ─────────────────────────────────────────────────────

function DashboardHeader({ name }: { name: string }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1
          className="text-foreground"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
        >
          {greeting}, {name || "Student"} 👋
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "var(--muted-foreground)" }}
        >
          Here's your CapTrack overview for today.
        </p>
      </div>
      <div
        className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
        style={{
          background: "var(--secondary)",
          color: "var(--muted-foreground)",
        }}
      >
        <Clock size={14} />
        {new Date().toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export function StudentDashboard({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
}) {
  const name = localStorage.getItem("userName") || "";

  // 👈 Universal Robust Navigation Handler
  const handleNavigate = useCallback(
    (page: string) => {
      // 1. Parent state updater callback (App.tsx / Router)
      if (onNavigate) {
        onNavigate(page);
      }

      // 2. LocalStorage persistence for tab state
      localStorage.setItem("page", page);
      localStorage.setItem("activeTab", page);

      // 3. Custom events for same-tab UI listeners
      window.dispatchEvent(
        new CustomEvent("ct-navigate", { detail: page })
      );
      window.dispatchEvent(
        new CustomEvent("navigation", { detail: page })
      );
      window.dispatchEvent(new Event("storage"));

      // 4. Hash route support if applicable
      if (window.location.hash) {
        window.location.hash = `#${page}`;
      }
    },
    [onNavigate]
  );

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <DashboardHeader name={name} />

        {/* Three-column grid */}
        <div
          className="grid gap-5"
          style={{
            gridTemplateColumns: "1fr",
          }}
        >
          <style>{`
            @media (min-width: 1024px) {
              .ct-dashboard-grid {
                grid-template-columns: 272px 1fr 312px;
                grid-template-rows: auto;
                align-items: start;
              }
              .ct-panel {
                max-height: calc(100vh - 140px);
                min-height: 520px;
              }
            }
            @media (max-width: 1023px) {
              .ct-panel {
                min-height: 400px;
              }
            }
          `}</style>

          <div className="grid gap-5 ct-dashboard-grid">
            {/* 1 – Profile Snapshot */}
            <div className="ct-panel">
              <ProfileSnapshot onNavigate={handleNavigate} />
            </div>

            {/* 2 – Project Summary */}
            <div className="ct-panel">
              <ProjectWidget onNavigate={handleNavigate} />
            </div>

            {/* 3 – Activity Log */}
            <div className="ct-panel">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}