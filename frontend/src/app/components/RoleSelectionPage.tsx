import {
  ArrowRight,
  GraduationCap,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";

import type { Role } from "./ui/Sidebar";

interface RoleSelectionPageProps {
  onSelectRole: (role: Role) => void;
}

const roleCards: {
  role: Role;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}[] = [
  {
    role: "student",
    title: "Student",
    subtitle: "Continue as project team member",
    description:
      "Create profile, find teammates, request supervisors, submit tasks, and track project progress.",
    icon: <Users size={26} />,
    features: ["Team matching", "Project workspace", "Task submissions"],
  },
  {
    role: "supervisor",
    title: "Supervisor",
    subtitle: "Continue as faculty supervisor",
    description:
      "Manage groups, assign milestones, review submissions, give feedback, and update supervision slots.",
    icon: <UserCheck size={26} />,
    features: ["Group monitoring", "Feedback queue", "Slot management"],
  },
  {
    role: "admin",
    title: "Administrator",
    subtitle: "Continue as department admin",
    description:
      "Monitor supervisor workload, group formation, progress, submissions, reports, and project archive.",
    icon: <Shield size={26} />,
    features: ["Workload overview", "Reports", "Institutional archive"],
  },
];

export function RoleSelectionPage({ onSelectRole }: RoleSelectionPageProps) {
  return (
    <main className="min-h-screen bg-[#eef3f8] px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600 text-white">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-950">CapTrack</h1>
              <p className="text-sm text-slate-500">East West University</p>
            </div>
          </div>

          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            Summer 2026 Capstone
          </span>
        </header>

        <section className="mb-10 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-700">
            Role Selection
          </p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            Choose how you want to continue
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            CapTrack provides separate workspaces for students, supervisors, and
            administrators so each user can access the right tools.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {roleCards.map((card) => (
            <button
              key={card.role}
              onClick={() => onSelectRole(card.role)}
              className="group rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white">
                  {card.icon}
                </div>

                <ArrowRight
                  size={22}
                  className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-cyan-700"
                />
              </div>

              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                {card.subtitle}
              </p>
              <h3 className="mt-3 text-2xl font-bold text-slate-950">
                {card.title}
              </h3>
              <p className="mt-4 min-h-[84px] leading-7 text-slate-600">
                {card.description}
              </p>

              <div className="mt-6 space-y-3">
                {card.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    <div className="h-2 w-2 rounded-full bg-cyan-500" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl bg-[#0f5f8f] px-5 py-3 text-center font-semibold text-white transition group-hover:bg-[#0b527d]">
                Continue as {card.title}
              </div>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}