import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Search, Github, Linkedin, Star, BookOpen, Users, Check, ExternalLink, X } from "lucide-react";

type ProfileItem = {
  id: string;
  userId: string;
  name: string;
  email?: string;
  department: string;
  semester: string;
  cgpa: number;
  credits: number;
  avatar: string;
  skills: string[];
  research: string;
  status: string;
  github: string;
  linkedin: string;
  groupName: string;
  projectTitle: string;
  supervisor: string;
  progress: number;
  submissions: number;
  lastUpdate: string;
  visibility?: boolean; 
  findTeammatesVisibility?: boolean; 
  isPublic?: boolean;
};

type OverviewResponse = {
  viewer?: {
    name: string;
    email: string;
    role: string;
  };
  stats?: {
    totalStudents: number;
    openStudents: number;
    inTeamStudents: number;
  };
  profiles?: ProfileItem[];
  skills?: string[];
};

const API = axios.create({
  baseURL: "https://captrack-backend.onrender.com/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["x-auth-token"] = token;
  return config;
});

// Helper to safely format URLs
const formatUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
};

export function StudentProfiles({ viewerRole = "student" }: { viewerRole?: string }) {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("cgpa_desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Track invitations sent (Loaded from localStorage to survive page refresh)
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // 1️⃣ Load previously sent invites from localStorage on mount
    const savedInvites = localStorage.getItem("sent_invites");
    if (savedInvites) {
      try {
        setInvitedMap(JSON.parse(savedInvites));
      } catch (e) {
        console.error("Failed to parse saved invites");
      }
    }

    // 2️⃣ Load student profiles
    const loadProfiles = async () => {
      try {
        setLoading(true);
        const response = await API.get("/profiles/overview");
        setOverview(response.data);
      } catch (err) {
        console.error("Student profiles fetch error:", err);
        setError("Failed to load student profiles.");
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, []);

  const profiles = overview?.profiles || [];
  const skillPool = overview?.skills || [];
  const viewerEmail = overview?.viewer?.email || localStorage.getItem("userEmail") || "";

  const semesterRank = (semester: string) => {
    const match = String(semester || "").match(/(Spring|Summer|Fall|Winter)\s+(\d{4})/i);

    if (!match) {
      return 0;
    }

    const seasonOrder: Record<string, number> = {
      winter: 1,
      spring: 2,
      summer: 3,
      fall: 4,
    };

    const season = seasonOrder[match[1].toLowerCase()] || 0;
    const year = Number(match[2]) || 0;

    return year * 10 + season;
  };

  const filtered = useMemo(() => {
    const matchingProfiles = profiles.filter((profile) => {
      // Hide profile if visibility is turned off (false)
      if (
        profile.visibility === false || 
        profile.findTeammatesVisibility === false || 
        profile.isPublic === false
      ) {
        // Allow users to still see their own profile even if hidden from others
        const isOwnProfile = profile.email === viewerEmail || profile.id === viewerEmail;
        if (!isOwnProfile) {
          return false;
        }
      }

      const matchSearch =
        profile.name.toLowerCase().includes(search.toLowerCase()) ||
        profile.skills.some((skill) => skill.toLowerCase().includes(search.toLowerCase())) ||
        (profile.research && profile.research.toLowerCase().includes(search.toLowerCase())) ||
        (profile.projectTitle && profile.projectTitle.toLowerCase().includes(search.toLowerCase())) ||
        (profile.supervisor && profile.supervisor.toLowerCase().includes(search.toLowerCase()));

      const matchSkill = !selectedSkill || profile.skills.includes(selectedSkill);
      const matchStatus = statusFilter === "all" || profile.status === statusFilter;

      return matchSearch && matchSkill && matchStatus;
    });

    return [...matchingProfiles].sort((left, right) => {
      switch (sortBy) {
        case "cgpa_asc":
          return left.cgpa - right.cgpa;
        case "cgpa_desc":
          return right.cgpa - left.cgpa;
        case "skills_asc":
          return left.skills.length - right.skills.length;
        case "skills_desc":
          return right.skills.length - left.skills.length;
        case "semester_desc":
          return semesterRank(left.semester) - semesterRank(right.semester);
        case "semester_asc":
          return semesterRank(right.semester) - semesterRank(left.semester);
        case "name_asc":
        default:
          return left.name.localeCompare(right.name);
      }
    });
  }, [profiles, search, selectedSkill, statusFilter, sortBy, viewerEmail]);

  useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    }

    if (selectedId && !filtered.some((profile) => profile.id === selectedId)) {
      setSelectedId(filtered[0]?.id || null);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((profile) => profile.id === selectedId) || filtered[0] || null;

  // Toggle Invitation State (Send or Cancel)
  const handleToggleInvitation = async () => {
    if (!selected || selected.status === "In Team") return;

    if (viewerRole === "supervisor") {
      const profileUrl = formatUrl(selected.linkedin) || formatUrl(selected.github);
      if (profileUrl) {
        window.open(profileUrl, "_blank", "noreferrer");
      } else {
        alert("No external profile link available for this student.");
      }
      return;
    }

    const isCurrentlyInvited = Boolean(invitedMap[selected.id]);

    if (isCurrentlyInvited) {
      // ❌ REMOVE INVITATION
      setInvitedMap((prev) => {
        const updatedMap = { ...prev };
        delete updatedMap[selected.id];
        localStorage.setItem("sent_invites", JSON.stringify(updatedMap));
        return updatedMap;
      });
      console.log("Invitation removed for:", selected.id);
    } else {
      // ✅ SEND INVITATION
      setInvitedMap((prev) => {
        const updatedMap = { ...prev, [selected.id]: true };
        localStorage.setItem("sent_invites", JSON.stringify(updatedMap));
        return updatedMap;
      });

      try {
        const viewerName = overview?.viewer?.name || "A CapTrack user";
        const targetUserId = selected.userId || selected.id;
        
        await API.post("/activity", {
          recipientId: targetUserId,
          type: "team_invite",
          title: "Team Invitation Received",
          body: `${viewerName} has invited you to join their capstone team.`,
          actionStatus: "pending"
        });
        console.log("Activity logged successfully for:", targetUserId);
      } catch (apiError) {
        console.error("Failed to post activity to dashboard feed:", apiError);
      }

      // Open Mail Client with delay to allow API to complete safely
      setTimeout(() => {
        const targetEmail = selected.email || (selected.id.includes("@") ? selected.id : `${selected.id}@std.ewubd.edu`);
        const viewerNameForMail = overview?.viewer?.name || "A CapTrack user";
        const subject = encodeURIComponent(`Team invitation from ${viewerNameForMail}`);
        const bodyText = encodeURIComponent(
          `Hi ${selected.name},\n\nI found your profile on CapTrack and would like to invite you to join my team.\n\nBest regards,\n${viewerNameForMail}`
        );

        window.open(`mailto:${targetEmail}?subject=${subject}&body=${bodyText}`, "_top");
      }, 800);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-7xl p-6 text-sm text-muted-foreground">Loading student profiles...</div>;
  }

  if (error) {
    return <div className="mx-auto max-w-7xl p-6 text-sm text-red-600">{error}</div>;
  }

  const isSelf = selected && (selected.email === viewerEmail || selected.id === viewerEmail);
  const isInvited = selected && Boolean(invitedMap[selected.id]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {viewerRole === "supervisor" ? "Student Profiles" : "Find Teammates"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse student profiles filtered by skills, project assignment, and availability.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, skill, project, or research interest..."
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="cursor-pointer rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"
        >
          <option value="all">All Status</option>
          <option value="Open">Open to Team</option>
          <option value="In Team">In Team</option>
        </select>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="cursor-pointer rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"
        >
          <option value="cgpa_desc">CGPA: High to Low</option>
          <option value="cgpa_asc">CGPA: Low to High</option>
          <option value="skills_desc">Skills: Most to Least</option>
          <option value="skills_asc">Skills: Least to Most</option>
          <option value="semester_desc">Semester: Latest First</option>
          <option value="semester_asc">Semester: Earliest First</option>
          <option value="name_asc">Name: A to Z</option>
        </select>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedSkill(null)}
          className="rounded-full border px-3 py-1 text-xs font-medium transition-all"
          style={{
            background: !selectedSkill ? "#1e3a5f" : "transparent",
            color: !selectedSkill ? "#fff" : "#5a7190",
            borderColor: !selectedSkill ? "#1e3a5f" : "#dde6f0",
          }}
        >
          All Skills
        </button>
        {skillPool.map((skill) => (
          <button
            key={skill}
            onClick={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
            className="rounded-full border px-3 py-1 text-xs font-medium transition-all"
            style={{
              background: selectedSkill === skill ? "#0891b2" : "transparent",
              color: selectedSkill === skill ? "#fff" : "#5a7190",
              borderColor: selectedSkill === skill ? "#0891b2" : "#dde6f0",
            }}
          >
            {skill}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((profile) => {
              const profileIsSelf = profile.email === viewerEmail || profile.id === viewerEmail;

              return (
                <div
                  key={profile.id}
                  onClick={() => setSelectedId(profile.id)}
                  className="cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: selected?.id === profile.id ? "#0891b2" : undefined }}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      style={{ background: "rgba(8,145,178,0.12)", color: "#0891b2" }}
                    >
                      {profile.avatar || profile.name?.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {profile.name} {profileIsSelf && <span className="text-xs text-cyan-600 font-normal">(You)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {profile.id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {profile.department || "CSE"} · {profile.semester || "N/A"}
                      </div>
                    </div>

                    <span
                      className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        background: profile.status === "Open" ? "#d1fae5" : "#dbeafe",
                        color: profile.status === "Open" ? "#065f46" : "#1d4ed8",
                      }}
                    >
                      {profile.status || "Open"}
                    </span>
                  </div>

                  <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Star size={11} />{profile.cgpa ?? "—"} CGPA</span>
                    <span className="flex items-center gap-1"><BookOpen size={11} />{profile.credits ?? 0} Credits</span>
                  </div>

                  <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                    {profile.research?.trim() ? profile.research : "No research interest specified."}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {profile.skills && profile.skills.length > 0 ? (
                      <>
                        {profile.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md px-2 py-0.5 text-xs"
                            style={{ background: "#e8eef5", color: "#1e3a5f" }}
                          >
                            {skill}
                          </span>
                        ))}
                        {profile.skills.length > 3 && (
                          <span className="rounded-md px-2 py-0.5 text-xs" style={{ background: "#e8eef5", color: "#5a7190" }}>
                            +{profile.skills.length - 3}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No skills listed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>No students match your search criteria.</p>
            </div>
          )}
        </div>

        {selected && (
          <div className="hidden w-72 flex-shrink-0 lg:block">
            <div className="sticky top-6 rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex flex-col items-center text-center">
                <div
                  className="mb-3 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
                  style={{ background: "rgba(8,145,178,0.12)", color: "#0891b2" }}
                >
                  {selected.avatar || selected.name?.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-foreground font-semibold">{selected.name}</h3>
                <div className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {selected.id}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {selected.department || "CSE"} · {selected.semester || "N/A"}
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-secondary p-3 text-center">
                  <div className="font-semibold text-foreground">{selected.cgpa ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">CGPA</div>
                </div>
                <div className="rounded-lg bg-secondary p-3 text-center">
                  <div className="font-semibold text-foreground">{selected.credits ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Credits</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Research Interest</div>
                <p className="text-xs leading-relaxed text-foreground">
                  {selected.research?.trim() ? selected.research : "No research interest specified."}
                </p>
              </div>

              <div className="mb-4">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Project</div>
                <p className="text-xs leading-relaxed text-foreground font-medium">
                  {selected.projectTitle?.trim() ? selected.projectTitle : "No project assigned yet"}
                </p>
                {selected.supervisor && (
                  <p className="mt-1 text-xs text-muted-foreground">Supervisor: {selected.supervisor}</p>
                )}
                {selected.submissions > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">{selected.submissions} submissions · Last update: {selected.lastUpdate}</p>
                )}
              </div>

              {selected.skills && selected.skills.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.skills.map((skill) => (
                      <span key={skill} className="rounded-md px-2 py-0.5 text-xs" style={{ background: "#e8eef5", color: "#1e3a5f" }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(selected.github || selected.linkedin) && (
                <div className="space-y-2 pt-2 border-t border-border">
                  {selected.github && (
                    <a
                      href={formatUrl(selected.github)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-accent truncate"
                    >
                      <Github size={13} /> {selected.github}
                    </a>
                  )}
                  {selected.linkedin && (
                    <a
                      href={formatUrl(selected.linkedin)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-accent truncate"
                    >
                      <Linkedin size={13} /> {selected.linkedin}
                    </a>
                  )}
                </div>
              )}

              {/* ✅ Action Buttons Section */}
              {viewerRole !== "admin" && (
                <div className="mt-4">
                  {isSelf ? (
                    <div className="w-full text-center py-2 text-xs font-medium text-muted-foreground bg-secondary rounded-lg border border-border">
                      This is your profile
                    </div>
                  ) : selected?.status === "In Team" ? (
                    /* 🔒 Disabled state for students already in a team */
                    <button
                      type="button"
                      disabled
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium bg-secondary text-muted-foreground border border-border cursor-not-allowed opacity-75"
                    >
                      Already in Team
                    </button>
                  ) : (
                    /* ✉️ Invite / Toggle Action for available students */
                    <button
                      type="button"
                      onClick={handleToggleInvitation}
                      className={`group w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all cursor-pointer ${
                        isInvited 
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/20"
                          : "text-white hover:opacity-90"
                      }`}
                      style={!isInvited ? { background: "#0891b2" } : {}}
                    >
                      {viewerRole === "supervisor" ? (
                        <>
                          <ExternalLink size={14} /> View Full Profile
                        </>
                      ) : isInvited ? (
                        <>
                          <span className="flex items-center gap-1.5 group-hover:hidden">
                            <Check size={15} /> Invitation Sent
                          </span>
                          <span className="hidden items-center gap-1.5 group-hover:flex">
                            <X size={15} /> Cancel Invitation
                          </span>
                        </>
                      ) : (
                        "Invite to Team"
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}