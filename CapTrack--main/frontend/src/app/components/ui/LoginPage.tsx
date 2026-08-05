import { useState, type FormEvent } from "react";
import axios from "axios";
import {
  ArrowRight,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

interface LoginUser {
  name: string;
  email: string;
  role: "student" | "supervisor" | "admin";
}

interface LoginPageProps {
  onLogin: (user: LoginUser) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [accountRole, setAccountRole] = useState<"student" | "supervisor">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegistering) {
        await API.post("/auth/register", {
          name,
          email,
          password,
          role: accountRole,
        });

        setSuccess("Account created successfully. You can login now.");
        setIsRegistering(false);
        return;
      }

      const response = await API.post("/auth/login", { email, password });

      if (response.data.token) {
        const user = response.data.user || {};
        const loginUser: LoginUser = {
          name: user.name || "CapTrack User",
          email: user.email || email,
          role: user.role || "student",
        };

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", loginUser.role);
        localStorage.setItem("userName", loginUser.name);
        localStorage.setItem("userEmail", loginUser.email);
        onLogin(loginUser);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          (isRegistering
            ? "Account creation failed."
            : "Login failed. Please check your credentials.")
      );
    } finally {
      setLoading(false);
    }
  };

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
                  {isRegistering ? "Create Account" : "Welcome Back"}
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  {isRegistering ? "Join CapTrack" : "Login to CapTrack"}
                </h2>
                <p className="mt-2 text-slate-500">
                  {isRegistering
                    ? "Create an account with your EWU email."
                    : "Use your university account to continue."}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700 border border-emerald-200">
                  {success}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {isRegistering && (
                  <>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Full Name
                      </span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <Users size={18} className="text-slate-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-transparent text-sm outline-none"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Account Type
                      </span>
                      <select
                        value={accountRole}
                        onChange={(e) =>
                          setAccountRole(e.target.value as "student" | "supervisor")
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                      >
                        <option value="student">Student (@std.ewubd.edu)</option>
                        <option value="supervisor">Supervisor (@ewubd.edu)</option>
                      </select>
                    </label>
                  </>
                )}

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Email Address
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Mail size={18} className="text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        isRegistering && accountRole === "student"
                          ? "name@std.ewubd.edu"
                          : "name@ewubd.edu"
                      }
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </label>

                {!isRegistering && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-600">
                      <input type="checkbox" defaultChecked />
                      Remember me
                    </label>
                    <button className="font-medium text-cyan-700 hover:text-cyan-800">
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f5f8f] px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:bg-[#0b527d] disabled:opacity-50"
                >
                  {loading
                    ? isRegistering
                      ? "Creating account..."
                      : "Logging in..."
                    : isRegistering
                      ? "Create account"
                      : "Login"}
                  <ArrowRight size={18} />
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                {isRegistering
                  ? "Already have an account?"
                  : "Do not have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError("");
                    setSuccess("");
                  }}
                  className="font-semibold text-cyan-700"
                >
                  {isRegistering ? "Login" : "Create account"}
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
