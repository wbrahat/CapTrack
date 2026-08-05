import "../styles/fonts.css";
import { useEffect, useState } from "react";

import { AdminDashboard } from "./components/AdminDashboard";
import { AdminSubmissionsPage } from "./components/AdminSubmissionsPage";
import { AllProjectsPage } from "./components/AllProjectsPage";
import { CollaborationFeed } from "./components/CollaborationFeed";
import { FeedbackPage } from "./components/FeedbackPage";
import { FeedbackQueuePage } from "./components/FeedbackQueuePage";
import { LoginPage } from "./components/ui/LoginPage";
import { MilestoneTasksPage } from "./components/MilestoneTasksPage";
import { PendingSubmissionsPage } from "./components/PendingSubmissionsPage";
import { ProjectArchivePage } from "./components/ProjectArchivePage";
import { ProjectWorkspace } from "./components/ProjectWorkspace";
import { GroupWorkspace } from "./components/GroupWorkspace";
import { RoleSelectionPage } from "./components/RoleSelectionPage";
import { SettingsPage } from "./components/SettingsPage";
import { Sidebar, type Page, type Role } from "./components/Sidebar";
import { StudentDashboard } from "./components/StudentDashboard";
import { StudentProfiles } from "./components/StudentProfiles";
import { SubmissionsPage } from "./components/SubmissionsPage";
import { SupervisorDashboard } from "./components/SupervisorDashboard";
import { SupervisorProfiles } from "./components/SupervisorProfiles";
import { TasksPage } from "./components/TasksPage";
import { Toaster } from "./components/ui/sonner";

const defaultPages: Record<Role, Page> = {
  student: "dashboard",
  supervisor: "dashboard",
  admin: "admin",
};

interface LoginUser {
  name: string;
  email: string;
  role: Role;
}

function ProjectAccessGate() {
  return (
    <div className="mx-auto flex min-h-full max-w-4xl items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600">
          <span className="text-xl font-semibold">!</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Project Workspace Locked</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Project group is not assigned yet. You will be able to access this workspace once a project group is assigned.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem("token"))
  );
  const [hasSelectedRole, setHasSelectedRole] = useState(
    () => Boolean(localStorage.getItem("token"))
  );
  const [role, setRole] = useState<Role>(
    () => (localStorage.getItem("role") as Role) || "student"
  );
  const [page, setPage] = useState<Page>(
    () => (localStorage.getItem("page") as Page) || "dashboard"
  );
  const [isProjectGroupAssigned] = useState(
    () => localStorage.getItem("projectGroupAssigned") === "true"
  );
  const [userName, setUserName] = useState(
    () => localStorage.getItem("userName") || ""
  );
  const [userEmail, setUserEmail] = useState(
    () => localStorage.getItem("userEmail") || ""
  );

  useEffect(() => {
    if (isLoggedIn && hasSelectedRole) {
      localStorage.setItem("role", role);
      localStorage.setItem("page", page);
    }
  }, [isLoggedIn, hasSelectedRole, role, page]);

  // 👈 চাইল্ড কম্পোনেন্ট থেকে ইনস্ট্যান্ট নেভিগেশন ধরার জন্য গ্লোবাল ইভেন্ট লিসেনার
  useEffect(() => {
    const handleCustomNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<Page>;
      if (customEvent.detail) {
        setPage(customEvent.detail);
      }
    };

    window.addEventListener("ct-navigate", handleCustomNavigate);
    window.addEventListener("navigation", handleCustomNavigate);

    return () => {
      window.removeEventListener("ct-navigate", handleCustomNavigate);
      window.removeEventListener("navigation", handleCustomNavigate);
    };
  }, []);

  const handleLogin = (loggedInUser: LoginUser) => {
    const startPage = defaultPages[loggedInUser.role];

    localStorage.setItem("role", loggedInUser.role);
    localStorage.setItem("page", startPage);
    localStorage.setItem("userName", loggedInUser.name);
    localStorage.setItem("userEmail", loggedInUser.email);
    setRole(loggedInUser.role);
    setPage(startPage);
    setUserName(loggedInUser.name);
    setUserEmail(loggedInUser.email);
    setIsLoggedIn(true);
    setHasSelectedRole(true);
  };

  const handleRoleSelection = (selectedRole: Role) => {
    setRole(selectedRole);
    setPage(defaultPages[selectedRole]);
    localStorage.setItem("role", selectedRole);
    localStorage.setItem("page", defaultPages[selectedRole]);
    setHasSelectedRole(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("page");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    setHasSelectedRole(false);
    setRole("student");
    setPage("dashboard");
    setUserName("");
    setUserEmail("");
  };

  const renderPage = () => {
    const projectPages: Page[] = ["workspace", "project_workspace", "tasks", "submissions", "feedback", "group_chat"];

    // Global guard: if the project group is not assigned, show the access gate for any project‑related page.
    if (!isProjectGroupAssigned && projectPages.includes(page)) {
      return <ProjectAccessGate />;
    }

    switch (page) {
      case "dashboard":
        if (role === "supervisor") {
          return <SupervisorDashboard />;
        }

        if (role === "admin") {
          return <AdminDashboard />;
        }

        // ✅ এখানে onNavigate পাস করে দেওয়া হলো
        return <StudentDashboard onNavigate={(newPage) => setPage(newPage as Page)} />;

      case "students":
        return <StudentProfiles viewerRole={role} />;

      case "supervisors":
        return <SupervisorProfiles />;

      case "feed":
        return <CollaborationFeed viewerRole={role} />;

      case "workspace":
      case "project_workspace":
        if (role === "admin") {
          return <AllProjectsPage />;
        }

        return <ProjectWorkspace viewerRole={role} isProjectGroupAssigned={isProjectGroupAssigned} />;

      case "admin":
        return <AdminDashboard />;

      case "tasks":
        if (role === "supervisor") {
          return <MilestoneTasksPage />;
        }

        return <TasksPage />;

      case "submissions":
        if (role === "admin") {
          return <AdminSubmissionsPage />;
        }

        if (role === "supervisor") {
          return <PendingSubmissionsPage />;
        }

        return <SubmissionsPage />;

      case "feedback":
        if (role === "supervisor") {
          return <FeedbackQueuePage />;
        }

        return <FeedbackPage />;

      case "group_chat":
        return <GroupWorkspace viewerRole={role} isProjectGroupAssigned={isProjectGroupAssigned} />;

      case "archive":
        return <ProjectArchivePage />;

      case "settings":
        return <SettingsPage />;

      default:
        return <StudentDashboard onNavigate={(newPage) => setPage(newPage as Page)} />;
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (!hasSelectedRole) {
    return <RoleSelectionPage onSelectRole={handleRoleSelection} />;
  }

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "var(--background)",
      }}
    >
      <Toaster richColors closeButton position="top-right" />
      <Sidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        currentPage={page}
        onPageChange={setPage}
        onLogout={handleLogout}
        isProjectGroupAssigned={isProjectGroupAssigned}
      />

      <main className="flex-1 overflow-y-auto">{renderPage()}</main>
    </div>
  );
}