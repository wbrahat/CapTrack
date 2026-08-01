import {
  ArrowRight,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <main className="min-h-screen bg-[#0f2744] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden px-12 py-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute bottom-24 right-12 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500">
                <GraduationCap size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">CapTrack</h1>
                <p className="text-sm text-cyan-100/70">East West University</p>
              </div>
            </div>

            <div className="mt-24 max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
                <Sparkles size={16} />
                Capstone Project Lifecycle Management System
              </div>

              <h2 className="text-5xl font-bold leading-tight tracking-tight">
                Manage your capstone journey from team formation to final defense.
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200/80">
                CapTrack helps students find teammates, request supervisors,
                manage project milestones, submit deliverables, receive feedback,
                and track real-time progress in one platform.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={<Users size={20} />}
              title="Team Matching"
              description="Find compatible teammates by skills and research interest."
            />
            <FeatureCard
              icon={<ShieldCheck size={20} />}
              title="Supervisor Flow"
              description="Explore supervisor domains, slots, and project history."
            />
            <FeatureCard
              icon={<GraduationCap size={20} />}
              title="Progress Tracking"
              description="Track milestones, submissions, feedback, and evaluation."
            />
          </div>
        </section>

        <section className="flex items-center justify-center bg-slate-50 px-6 py-10 text-slate-950">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600 text-white">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">CapTrack</h1>
                  <p className="text-sm text-slate-500">East West University</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
              <div className="mb-8">
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-700">
                  Welcome Back
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  Login to CapTrack
                </h2>
                <p className="mt-2 text-slate-500">
                  Use your university account to continue.
                </p>
              </div>

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Email Address
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Mail size={18} className="text-slate-400" />
                    <input
                      type="email"
                      defaultValue="sabik@std.ewubd.edu"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Lock size={18} className="text-slate-400" />
                    <input
                      type="password"
                      defaultValue="captrack123"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </label>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" defaultChecked />
                    Remember me
                  </label>
                  <button className="font-medium text-cyan-700 hover:text-cyan-800">
                    Forgot password?
                  </button>
                </div>

                <button
                  onClick={onLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f5f8f] px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:bg-[#0b527d]"
                >
                  Login
                  <ArrowRight size={18} />
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-slate-500">
                Do not have an account?{" "}
                <button className="font-semibold text-cyan-700">
                  Create account
                </button>
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Demo UI for Group 5 CapTrack project prototype.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/20 text-cyan-100">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-200/70">{description}</p>
    </div>
  );
}