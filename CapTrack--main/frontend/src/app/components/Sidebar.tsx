import { useState, type ReactNode } from "react";
import {
  Archive,
  ClipboardCheck,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Lock,
  Settings,
  Shield,
  UploadCloud,
  UserCheck,
  Users,
  X,
} from "lucide-react";

export type Role = "student" | "supervisor" | "admin";

export type Page =
  | "dashboard"
  | "students"
  | "supervisors"
  | "feed"
  | "workspace"
  | "project_workspace"
  | "tasks"
  | "submissions"
  | "feedback"
  | "group_chat"
  | "archive"
  | "settings"
  | "admin";

interface SidebarProps {
  role: Role;
  userName: string;
  userEmail: string;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onLogout: () => void;
  isProjectGroupAssigned: boolean;
}

interface NavItem {
  page: Page;
  label: string;
  icon: ReactNode;
  section?: "main" | "project" | "account";
}

const roleNavItems: Record<Role, NavItem[]> = {
  student: [
    {
      page: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      section: "main",
    },
    {
      page: "students",
      label: "Find Teammates",
      icon: <Users size={18} />,
      section: "main",
    },
    {
      page: "supervisors",
      label: "Supervisor Directory",
      icon: <UserCheck size={18} />,
      section: "main",
    },
    {
      page: "feed",
      label: "Collaboration Feed",
      icon: <MessageSquare size={18} />,
      section: "main",
    },
    {
      page: "workspace",
      label: "Project Workspace",
      icon: <ClipboardList size={18} />,
      section: "project",
    },
    {
      page: "tasks",
      label: "Tasks",
      icon: <ClipboardCheck size={18} />,
      section: "project",
    },
    {
      page: "submissions",
      label: "Submissions",
      icon: <UploadCloud size={18} />,
      section: "project",
    },
    {
      page: "feedback",
      label: "Feedback",
      icon: <MessageSquare size={18} />,
      section: "project",
    },
    {
      page: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
      section: "account",
    },
  ],

  supervisor: [
    {
      page: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      section: "main",
    },
    {
      page: "students",
      label: "Student Profiles",
      icon: <Users size={18} />,
      section: "main",
    },
    {
      page: "feed",
      label: "Collaboration Feed",
      icon: <MessageSquare size={18} />,
      section: "main",
    },
    {
      page: "workspace",
      label: "Group Workspace",
      icon: <ClipboardList size={18} />,
      section: "project",
    },
    {
      page: "submissions",
      label: "Pending Submissions",
      icon: <UploadCloud size={18} />,
      section: "project",
    },
    {
      page: "tasks",
      label: "Milestone Tasks",
      icon: <ClipboardCheck size={18} />,
      section: "project",
    },
    {
      page: "feedback",
      label: "Feedback Queue",
      icon: <MessageSquare size={18} />,
      section: "project",
    },
    {
      page: "archive",
      label: "Project Archive",
      icon: <Archive size={18} />,
      section: "project",
    },
    {
      page: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
      section: "account",
    },
  ],

  admin: [
    {
      page: "admin",
      label: "Admin Overview",
      icon: <Shield size={18} />,
      section: "main",
    },
    {
      page: "students",
      label: "Student Profiles",
      icon: <Users size={18} />,
      section: "main",
    },
    {
      page: "supervisors",
      label: "Supervisor Directory",
      icon: <UserCheck size={18} />,
      section: "main",
    },
    {
      page: "workspace",
      label: "All Projects",
      icon: <ClipboardList size={18} />,
      section: "project",
    },
    {
      page: "feed",
      label: "Collaboration Feed",
      icon: <MessageSquare size={18} />,
      section: "project",
    },
    {
      page: "submissions",
      label: "Submissions",
      icon: <UploadCloud size={18} />,
      section: "project",
    },
    {
      page: "archive",
      label: "Archive",
      icon: <Archive size={18} />,
      section: "project",
    },
    {
      page: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
      section: "account",
    },
  ],
};

const roleLabels: Record<Role, string> = {
  student: "Md. Sabik Hossen",
  supervisor: "Ahmed Adnan",
  admin: "Administrator",
};

const roleSubtitles: Record<Role, string> = {
  student: "ID: 2023-2-60-305",
  supervisor: "Lecturer, CSE",
  admin: "East West University",
};

const roleShortLabels: Record<Role, string> = {
  student: "Student",
  supervisor: "Sup.",
  admin: "Admin",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div
      className="px-3 pt-4 pb-2 text-xs uppercase tracking-widest"
      style={{
        color: "rgba(232,238,245,0.4)",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {children}
    </div>
  );
}

export function Sidebar({
  role,
  userName,
  userEmail,
  currentPage,
  onPageChange,
  onLogout,
  isProjectGroupAssigned,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Initialize project section open based on assignment status
  const [projectSectionOpen, setProjectSectionOpen] = useState(isProjectGroupAssigned);
  const navItems = roleNavItems[role];

  const mainItems = navItems.filter((item) => item.section === "main");
  const projectItems = navItems.filter((item) => item.section === "project");
  const accountItems = navItems.filter((item) => item.section === "account");
  const displayName = userName || roleLabels[role];
  const displaySubtitle = userEmail || roleSubtitles[role];
  const isProjectPage = ["workspace", "project_workspace", "tasks", "submissions", "feedback", "group_chat"].includes(currentPage);

  const handlePageChange = (page: Page) => {
    onPageChange(page);
    setMobileOpen(false);
  };

  const projectChildren =
    role === "student"
      ? [
          { page: "workspace" as Page, label: "Overview", icon: <ClipboardList size={16} /> },
          { page: "tasks" as Page, label: "Tasks", icon: <ClipboardCheck size={16} /> },
          { page: "submissions" as Page, label: "Submissions", icon: <UploadCloud size={16} /> },
          { page: "feedback" as Page, label: "Feedback", icon: <MessageSquare size={16} /> },
          { page: "group_chat" as Page, label: "Group Chat", icon: <MessageSquare size={16} /> },
        ]
      : [
          { page: "workspace" as Page, label: "Overview", icon: <ClipboardList size={16} /> },
          { page: "tasks" as Page, label: "Tasks", icon: <ClipboardCheck size={16} /> },
          { page: "submissions" as Page, label: "Submissions", icon: <UploadCloud size={16} /> },
          { page: "feedback" as Page, label: "Feedback", icon: <MessageSquare size={16} /> },
          { page: "group_chat" as Page, label: "Group Chat", icon: <MessageSquare size={16} /> },
        ];

  const renderNavItem = (item: NavItem) => {
    const active = currentPage === item.page;

    return (
      <button
        key={`${role}-${item.page}-${item.label}`}
        onClick={() => handlePageChange(item.page)}
        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all"
        style={{
          background: active ? "rgba(8,145,178,0.18)" : "transparent",
          color: active ? "#38bdf8" : "rgba(232,238,245,0.7)",
        }}
      >
        <span
          className="flex-shrink-0"
          style={{
            color: active ? "#38bdf8" : "rgba(232,238,245,0.5)",
          }}
        >
          {item.icon}
        </span>

        <span className="flex-1 text-left">{item.label}</span>

        {active && (
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: "#38bdf8" }}
          />
        )}
      </button>
    );
  };

  const renderProjectChild = (item: { page: Page; label: string; icon: ReactNode }) => {
    const active = currentPage === item.page;

    return (
      <button
        key={`project-child-${item.page}-${item.label}`}
        onClick={() => handlePageChange(item.page)}
        className="group flex w-full items-center gap-3 rounded-lg py-2 pl-10 pr-3 text-sm transition-all"
        style={{
          background: active ? "rgba(8,145,178,0.16)" : "transparent",
          color: active ? "#38bdf8" : "rgba(232,238,245,0.68)",
        }}
      >
        <span
          className="flex-shrink-0"
          style={{ color: active ? "#38bdf8" : "rgba(232,238,245,0.45)" }}
        >
          {item.icon}
        </span>

        <span className="flex-1 text-left">{item.label}</span>

        {active && <span className="h-2 w-2 rounded-full" style={{ background: "#38bdf8" }} />}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-600">
            <GraduationCap size={19} className="text-white" />
          </div>

          <div>
            <div
              className="font-semibold tracking-tight text-sidebar-foreground"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              CapTrack
            </div>
            <div
              className="text-xs"
              style={{ color: "rgba(232,238,245,0.5)" }}
            >
              East West University
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-sidebar-border px-4 py-3">
        <div
          className="mb-2 text-xs uppercase tracking-widest"
          style={{
            color: "rgba(232,238,245,0.4)",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          Viewing as
        </div>

        <div className="rounded-lg bg-sidebar-accent p-2 text-sm font-semibold text-white">
          {roleShortLabels[role]}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <SectionTitle>Navigation</SectionTitle>
        <div className="space-y-1">{mainItems.map(renderNavItem)}</div>

        {role === "admin" && projectItems.length > 0 && (
          <>
            <SectionTitle>Project</SectionTitle>
            <div className="space-y-1">{projectItems.map(renderNavItem)}</div>
          </>
        )}

        {role !== "admin" && (
          <>
            <SectionTitle>Project</SectionTitle>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  handlePageChange("workspace");
                  if (isProjectGroupAssigned) {
                    setProjectSectionOpen((previousValue) => !previousValue);
                  }
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all"
                style={{
                  background: isProjectPage ? "rgba(8,145,178,0.18)" : "transparent",
                  color: isProjectPage ? "#38bdf8" : "rgba(232,238,245,0.7)",
                }}
              >
                <ClipboardList size={18} className="flex-shrink-0" />
                <span className="flex-1 text-left">Project Workspace</span>
                {!isProjectGroupAssigned ? (
                  <Lock size={15} className="flex-shrink-0 text-cyan-300/80" />
                ) : projectSectionOpen ? (
                  <ChevronDown size={15} className="flex-shrink-0" />
                ) : (
                  <ChevronRight size={15} className="flex-shrink-0" />
                )}
              </button>

              {!isProjectGroupAssigned && (
                <div
                  className="mx-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs leading-relaxed"
                  style={{ color: "rgba(232,238,245,0.72)" }}
                >
                  Project group not assigned yet. Project tools will appear here once you are assigned.
                </div>
              )}

              {isProjectGroupAssigned && projectSectionOpen && (
                <div className="space-y-1 pt-1">
                  {projectChildren.map(renderProjectChild)}
                </div>
              )}
            </div>
          </>
        )}

        {accountItems.length > 0 && (
          <>
            <SectionTitle>Account</SectionTitle>
            <div className="space-y-1">{accountItems.map(renderNavItem)}</div>
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/70 p-3">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            style={{
              background: "rgba(8,145,178,0.25)",
              color: "#38bdf8",
            }}
          >
            {getInitials(displayName)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-sidebar-foreground">
              {displayName}
            </div>
            <div
              className="truncate text-xs"
              style={{
                color: "rgba(232,238,245,0.45)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {displaySubtitle}
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-600"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg shadow-lg lg:hidden"
        style={{ background: "#1e3a5f" }}
        onClick={() => setMobileOpen((previousValue) => !previousValue)}
      >
        {mobileOpen ? (
          <X size={18} className="text-white" />
        ) : (
          <Menu size={18} className="text-white" />
        )}
      </button>

      {mobileOpen && (
        <button
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className="fixed left-0 top-0 z-40 h-full w-64 transition-transform duration-300 lg:hidden"
        style={{
          background: "var(--sidebar)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <SidebarContent />
      </aside>

      <aside
        className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col lg:flex"
        style={{ background: "var(--sidebar)" }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
