import { useEffect, useState } from "react";
import axios from "axios";
import API from "../lib/api";
import { toast } from "sonner";
import {
  Bell,
  CheckCircle2,
  Eye,
  Lock,
  Mail,
  MonitorCog,
  Save,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { z } from "zod";

// Validation regex for URLs
const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;

const profileItems = [
  { label: "Full Name", key: "name" },
  { label: "Institution", key: "institution" },
  { label: "Department", key: "department" },
  { label: "System", key: "system" },
];

const skillOptions = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "Django",
  "Spring Boot",
  "MongoDB",
  "PostgreSQL",
  "SQL",
  "Docker",
  "AWS",
  "Git",
  "Figma",
  "Machine Learning",
  "Data Science",
  "UI/UX Design",
  "Android",
  "Flutter",
];

const notificationItems = [
  {
    title: "Submission Updates",
    key: "submissionUpdates" as const,
    description: "Receive alerts when a submission is uploaded or reviewed.",
  },
  {
    title: "Milestone Reminders",
    key: "milestoneReminders" as const,
    description: "Notify before upcoming milestone deadlines.",
  },
  {
    title: "Supervisor Feedback",
    key: "supervisorFeedback" as const,
    description: "Get notified when feedback is added to a task or submission.",
  },
  {
    title: "Collaboration Feed",
    key: "collaborationFeed" as const,
    description: "Receive updates for new supervisor or student recruitment posts.",
  },
];

const privacyItems = [
  {
    title: "Profile Visibility",
    value: "Visible to students, supervisors, and admin",
    key: "profileVisibility",
  },
  {
    title: "Project Visibility",
    value: "Visible inside assigned group workspace",
    key: "projectVisibility",
  },
  {
    title: "Archive Permission",
    value: "Final approved projects can appear in archive",
    key: "archivePermission",
  },
];

const securityItems = [
  {
    title: "Password Protection",
    description: "Account protected with login credentials.",
  },
  {
    title: "Role-Based Access",
    description: "Student, supervisor, and admin views are separated.",
  },
  {
    title: "Secure Review Workflow",
    description: "Submissions and feedback are role-controlled.",
  },
];

interface SettingsPageProps {
  role?: "student" | "supervisor" | "admin";
}

export function SettingsPage({ role }: SettingsPageProps) {
  const activeRole = role || (localStorage.getItem("role") as "student" | "supervisor" | "admin") || "student";
  const isStudent = activeRole === "student";
  const isSupervisor = activeRole === "supervisor";
  const isAdmin = activeRole === "admin";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [urlErrors, setUrlErrors] = useState({ github: "", linkedin: "", portfolio: "" });

  const [profileValues, setProfileValues] = useState({
    name: "",
    institution: "East West University",
    department: "Computer Science and Engineering",
    system: "CapTrack",
    skills: [] as string[],
    capstoneSemester: "",
    cgpa: "",
    credits: "",
    researchInterest: "",
    github: "",
    linkedin: "",
    portfolio: "",
    teamStatus: "",
    isProfileVisible: true,
  });

  const roleProfileItems = [
    { label: isAdmin ? "Admin Name" : isSupervisor ? "Faculty Name" : "Full Name", key: "name" },
    { label: "Institution", key: "institution" },
    { label: "Department", key: "department" },
    { label: isAdmin ? "Admin Portal" : isSupervisor ? "Supervisor Portal" : "System", key: "system" },
  ];

  const pageSubtitle = isSupervisor
    ? "Manage faculty profile information, supervision preferences, notifications, and account visibility."
    : isAdmin
      ? "Manage administrator account information, system preferences, and role-based access settings."
      : "Manage account information, notification preferences, profile visibility, security options, and system-level preferences.";

  const [notificationState, setNotificationState] = useState(
    notificationItems.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.key] = false;
      return acc;
    }, {})
  );

  const [visibilityState, setVisibilityState] = useState(
    privacyItems.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.key] = true;
      return acc;
    }, {})
  );

  const [systemState, setSystemState] = useState({
    emailAlerts: true,
    inAppNotifications: true,
    autoSaveFeedback: true,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await API.get("/auth/me");
        const user = response.data;
        setProfileValues({
          name: user?.name || "",
          institution: user?.profileSettings?.institution || "East West University",
          department: user?.profileSettings?.department || "Computer Science and Engineering",
          system: user?.profileSettings?.system || "CapTrack",
          skills: user?.skills || [],
          capstoneSemester: user?.capstoneSemester || "",
          cgpa: user?.cgpa != null ? String(user?.cgpa) : "",
          credits: user?.credits != null ? String(user?.credits) : "",
          researchInterest: user?.researchInterest || "",
          github: user?.github || "",
          linkedin: user?.linkedin || "",
          portfolio: user?.portfolio || "",
          teamStatus: user?.teamStatus || "",
          isProfileVisible: user?.privacyPreferences?.profileVisibility ?? true,
        });
        setNotificationState({
          submissionUpdates: Boolean(user?.notificationPreferences?.submissionUpdates ?? true),
          milestoneReminders: Boolean(user?.notificationPreferences?.milestoneReminders ?? true),
          supervisorFeedback: Boolean(user?.notificationPreferences?.supervisorFeedback ?? true),
          collaborationFeed: Boolean(user?.notificationPreferences?.collaborationFeed ?? false),
        });
        setVisibilityState({
          profileVisibility: Boolean(user?.privacyPreferences?.profileVisibility ?? true),
          projectVisibility: Boolean(user?.privacyPreferences?.projectVisibility ?? true),
          archivePermission: Boolean(user?.privacyPreferences?.archivePermission ?? true),
        });
        setSystemState({
          emailAlerts: Boolean(user?.systemPreferences?.emailAlerts ?? true),
          inAppNotifications: Boolean(user?.systemPreferences?.inAppNotifications ?? true),
          autoSaveFeedback: Boolean(user?.systemPreferences?.autoSaveFeedback ?? true),
        });
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast.error("Failed to load settings from the server.");
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Zod schema for settings validation
  const settingsSchema = z.object({
    name: z.string().min(1, "Name is required"),
    institution: z.string().min(1),
    department: z.string().min(1),
    system: z.string().min(1),
    skills: z.array(z.string()),
    capstoneSemester: z.string().optional(),
    cgpa: z.preprocess(val => Number(val), z.number().min(0).max(4).nullable()),
    credits: z.preprocess(val => Number(val), z.number().int().min(0).max(200).nullable()),
    researchInterest: z.string().optional(),
    github: z.string().optional().refine(val => !val || urlRegex.test(val), { message: "Please enter a valid URL" }),
    linkedin: z.string().optional().refine(val => !val || urlRegex.test(val), { message: "Please enter a valid URL" }),
    portfolio: z.string().optional().refine(val => !val || urlRegex.test(val), { message: "Please enter a valid URL" }),
    teamStatus: z.string().optional(),
    isProfileVisible: z.boolean(),
  });

  const validateSettings = () => {
    try {
      settingsSchema.parse(profileValues);
      setUrlErrors({ github: "", linkedin: "", portfolio: "" });
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: any = {};
        err.errors.forEach(e => {
          if (e.path[0]) {
            fieldErrors[e.path[0]] = e.message;
          }
        });
        setUrlErrors({
          github: fieldErrors.github || "",
          linkedin: fieldErrors.linkedin || "",
          portfolio: fieldErrors.portfolio || "",
        });
        toast.error(err.errors[0]?.message || "Validation error");
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      // Errors are shown via toast inside validateSettings
      return;
    }
    try {
      setSaving(true);
      await API.put("/auth/me", {
        name: profileValues.name,
        profileSettings: {
          institution: profileValues.institution,
          department: profileValues.department,
          system: profileValues.system,
        },
        skills: profileValues.skills,
        capstoneSemester: profileValues.capstoneSemester,
        cgpa: Number(profileValues.cgpa),
        credits: Number(profileValues.credits),
        researchInterest: profileValues.researchInterest,
        github: profileValues.github,
        linkedin: profileValues.linkedin,
        portfolio: profileValues.portfolio,
        teamStatus: profileValues.teamStatus,
        notificationPreferences: notificationState,
        privacyPreferences: {
          ...visibilityState,
          profileVisibility: profileValues.isProfileVisible,
        },
        systemPreferences: systemState,
      });
      toast.success("Settings saved to MongoDB.");
      // Refresh settings to reflect saved changes
      try {
        const refreshed = await API.get("/auth/me");
        const user = refreshed.data;
        setProfileValues({
          name: user?.name || "",
          institution: user?.profileSettings?.institution || "East West University",
          department: user?.profileSettings?.department || "Computer Science and Engineering",
          system: user?.profileSettings?.system || "CapTrack",
          skills: user?.skills || [],
          capstoneSemester: user?.capstoneSemester || "",
          cgpa: user?.cgpa != null ? String(user?.cgpa) : "",
          credits: user?.credits != null ? String(user?.credits) : "",
          researchInterest: user?.researchInterest || "",
          github: user?.github || "",
          linkedin: user?.linkedin || "",
          portfolio: user?.portfolio || "",
          teamStatus: user?.teamStatus || "",
          isProfileVisible: user?.privacyPreferences?.profileVisibility ?? true,
        });
        setNotificationState({
          submissionUpdates: Boolean(user?.notificationPreferences?.submissionUpdates ?? true),
          milestoneReminders: Boolean(user?.notificationPreferences?.milestoneReminders ?? true),
          supervisorFeedback: Boolean(user?.notificationPreferences?.supervisorFeedback ?? true),
          collaborationFeed: Boolean(user?.notificationPreferences?.collaborationFeed ?? false),
        });
        setVisibilityState({
          profileVisibility: Boolean(user?.privacyPreferences?.profileVisibility ?? true),
          projectVisibility: Boolean(user?.privacyPreferences?.projectVisibility ?? true),
          archivePermission: Boolean(user?.privacyPreferences?.archivePermission ?? true),
        });
        setSystemState({
          emailAlerts: Boolean(user?.systemPreferences?.emailAlerts ?? true),
          inAppNotifications: Boolean(user?.systemPreferences?.inAppNotifications ?? true),
          autoSaveFeedback: Boolean(user?.systemPreferences?.autoSaveFeedback ?? true),
        });
      } catch (e) {
        console.error("Failed to refresh settings after save:", e);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-[#f3f6fa] px-8 py-8 text-sm text-slate-500">
        Loading settings...
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#f3f6fa] px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500" style={{ fontFamily: "'DM Mono', monospace" }}>
            CapTrack · Account
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {isSupervisor ? "Supervisor Settings" : isAdmin ? "Admin Settings" : "Student Settings"}
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            {pageSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {/* Profile Settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <User size={21} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  {isSupervisor ? "Faculty Profile Settings" : isAdmin ? "Admin Profile Settings" : "Profile Settings"}
                </h2>
                <p className="text-sm text-slate-500">
                  {isSupervisor
                    ? "Faculty information shown to students and assigned project groups."
                    : isAdmin
                      ? "Administrative profile information used inside CapTrack."
                      : "Basic profile information used across CapTrack."}
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {roleProfileItems.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="mb-1 text-xs uppercase tracking-wide text-slate-500" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {item.label}
                  </div>
                  <input
                    value={profileValues[item.key as keyof typeof profileValues] as any}
                    onChange={(e) =>
                      setProfileValues((prev) => ({ ...prev, [item.key]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              ))}
            </div>

            {isStudent && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Academic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1" htmlFor="cgpa">
                    CGPA
                  </label>
                  <input
                    id="cgpa"
                    type="number"
                    step="0.01"
                    max="4"
                    value={profileValues.cgpa}
                    onChange={(e) => setProfileValues((p) => ({ ...p, cgpa: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1" htmlFor="credits">
                    Completed Credits
                  </label>
                  <input
                    id="credits"
                    type="number"
                    min="0"
                    value={profileValues.credits}
                    onChange={(e) => setProfileValues((p) => ({ ...p, credits: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1" htmlFor="capstoneSemester">
                    Target Capstone Semester
                  </label>
                  <input
                    id="capstoneSemester"
                    type="text"
                    placeholder="e.g., Summer 2026"
                    value={profileValues.capstoneSemester}
                    onChange={(e) => setProfileValues((p) => ({ ...p, capstoneSemester: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
            </div>
            )}

            {/* Research Interests Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {isSupervisor ? "Research & Supervision Focus" : isAdmin ? "Administrative Focus" : "Research Interests"}
              </h3>
              <textarea
                rows={4}
                placeholder={
                  isSupervisor
                    ? "Describe research areas, preferred capstone domains, and supervision interests..."
                    : isAdmin
                      ? "Describe admin responsibilities or coordination focus..."
                      : "Describe preferred project domains, ideas, and career goals..."
                }
                value={profileValues.researchInterest}
                onChange={(e) => setProfileValues((p) => ({ ...p, researchInterest: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {/* External Profiles Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">External Profiles</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1" htmlFor="github">
                    GitHub Profile
                  </label>
                  <input
                    id="github"
                    type="text"
                    value={profileValues.github}
                    onChange={(e) => setProfileValues((p) => ({ ...p, github: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  {urlErrors.github && (<p className="mt-1 text-xs text-rose-600">{urlErrors.github}</p>)}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1" htmlFor="linkedin">
                    LinkedIn Profile
                  </label>
                  <input
                    id="linkedin"
                    type="text"
                    value={profileValues.linkedin}
                    onChange={(e) => setProfileValues((p) => ({ ...p, linkedin: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  {urlErrors.linkedin && (<p className="mt-1 text-xs text-rose-600">{urlErrors.linkedin}</p>)}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1" htmlFor="portfolio">
                    Portfolio Website
                  </label>
                  <input
                    id="portfolio"
                    type="text"
                    value={profileValues.portfolio}
                    onChange={(e) => setProfileValues((p) => ({ ...p, portfolio: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  {urlErrors.portfolio && (<p className="mt-1 text-xs text-rose-600">{urlErrors.portfolio}</p>)}
                </div>
              </div>
            </div>

            {/* Technical & Professional Skills */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {isSupervisor ? "Expertise & Research Areas" : isAdmin ? "Administrative Skills" : "Technical & Professional Skills"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(showAllSkills ? skillOptions : skillOptions.slice(0, 8)).map((skill) => {
                  const selected = profileValues.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        setProfileValues((prev) => {
                          const exists = prev.skills.includes(skill);
                          const newSkills = exists
                            ? prev.skills.filter((s) => s !== skill)
                            : [...prev.skills, skill];
                          return { ...prev, skills: newSkills };
                        });
                      }}
                      className={`px-3 py-1 rounded-full text-sm border ${selected ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-800 border-slate-300"}`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
              {skillOptions.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllSkills((prev) => !prev)}
                  className="mt-2 text-sm text-cyan-600 underline"
                >
                  {showAllSkills ? "Show less" : "Show all skills"}
                </button>
              )}
            </div>

            {isStudent && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Team Status & Privacy</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1" htmlFor="teamStatus">
                    Team Status
                  </label>
                  <select
                    id="teamStatus"
                    value={profileValues.teamStatus}
                    onChange={(e) => setProfileValues((p) => ({ ...p, teamStatus: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="" disabled>
                      Select status...
                    </option>
                    <option value="Open">Open</option>
                    <option value="In a Team">In a Team</option>
                  </select>
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="mr-3 text-xs uppercase tracking-wide text-slate-500" htmlFor="profileVisible">
                    Find Teammates Visibility
                  </label>
                  <input
                    id="profileVisible"
                    type="checkbox"
                    checked={profileValues.isProfileVisible}
                    onChange={(e) => setProfileValues((p) => ({ ...p, isProfileVisible: e.target.checked }))}
                    className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <Bell size={21} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Notification Preferences</h2>
                <p className="text-sm text-slate-500">Control which system updates should notify the user.</p>
              </div>
            </div>
            <div className="space-y-3">
              {notificationItems.map((item) => (
                <div key={item.title} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-4">
                  <div>
                    <h3 className="font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNotificationState((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                    }
                    aria-pressed={notificationState[item.key]}
                    className={`flex h-7 w-12 items-center rounded-full px-1 transition ${
                      notificationState[item.key] ? "bg-cyan-600" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
                        notificationState[item.key] ? "ml-5" : "ml-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Visibility */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <Eye size={21} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Privacy &amp; Visibility</h2>
                <p className="text-sm text-slate-500">Manage how profile and project information appears to others.</p>
              </div>
            </div>
            <div className="space-y-3">
              {privacyItems.map((item) => (
                <div key={item.title} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-4">
                  <div>
                    <h3 className="font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{item.value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setVisibilityState((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                    }
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      visibilityState[item.key]
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {visibilityState[item.key] ? "Active" : "Hidden"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security Options */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <ShieldCheck size={21} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Security Options</h2>
                <p className="text-sm text-slate-500">Control password protection, role based access, and secure workflow.</p>
              </div>
            </div>
            <div className="space-y-3">
              {securityItems.map((item) => (
                <div key={item.title} className="rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <Lock size={15} className="text-cyan-700" />
                    {item.title}
                  </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Settings size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">Account Overview</h3>
            </div>
            <div className="rounded-2xl bg-cyan-50 p-5">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-700 text-lg font-bold text-white">CT</div>
              <h4 className="font-semibold text-slate-950">CapTrack User Account</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This account uses role-based navigation for student, supervisor, and administrator workflows.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function PreferenceItem({ icon, text, enabled, onToggle }: { icon: React.ReactNode; text: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
    >
      <span className="text-cyan-700">{icon}</span>
      <span className="flex-1">{text}</span>
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${enabled ? "bg-cyan-600 text-white" : "bg-slate-200 text-slate-600"}`}>
        {enabled ? "On" : "Off"}
      </span>
    </button>
  );
}
