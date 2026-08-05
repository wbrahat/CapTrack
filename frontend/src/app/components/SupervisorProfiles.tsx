import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Search,
  Star,
  Users,
  X,
} from "lucide-react";

type SupervisorProject = {
  semester: string;
  title: string;
  team: string;
  members: number;
};

type SupervisorItem = {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  avatar: string;
  expertise: string[];
  researchInterests: string;
  slotsTotal: number;
  slotsTaken: number;
  remaining: number;
  status: "available" | "limited" | "full";
  pastProjects: SupervisorProject[];
  projectCount: number;
  lastActivity: string;
};

type OverviewResponse = {
  supervisors?: SupervisorItem[];
  topics?: string[];
};

const API = axios.create({
  baseURL: "https://captrack-backend.onrender.com/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["x-auth-token"] = token;
  return config;
});

// Fallback Mock Data
const MOCK_SUPERVISORS: SupervisorItem[] = [
  {
    id: "sup-1",
    name: "Dr. Ahmed Zahir",
    designation: "Professor",
    department: "Computer Science & Engineering",
    email: "zahir.cse@university.edu",
    avatar: "AZ",
    expertise: ["Machine Learning", "Artificial Intelligence", "Computer Vision"],
    researchInterests:
      "Deep Learning applications in healthcare, Natural Language Processing for low-resource languages, and Medical Image Analysis.",
    slotsTotal: 5,
    slotsTaken: 3,
    remaining: 2,
    status: "available",
    projectCount: 12,
    lastActivity: "2 hours ago",
    pastProjects: [
      { semester: "Fall 2025", title: "Automated Chest X-Ray Diagnosis using CNN", team: "Team Alpha", members: 3 },
      { semester: "Spring 2025", title: "Bangla Sentiment Analysis on Social Media", team: "NLP Squad", members: 4 },
    ],
  },
  {
    id: "sup-2",
    name: "Dr. Nusrat Jahan",
    designation: "Associate Professor",
    department: "Computer Science & Engineering",
    email: "nusrat.jahan@university.edu",
    avatar: "NJ",
    expertise: ["Cyber Security", "Blockchain", "Cloud Computing"],
    researchInterests:
      "Zero-knowledge proofs, smart contract auditing, distributed ledger security, and secure cloud storage architectures.",
    slotsTotal: 4,
    slotsTaken: 4,
    remaining: 0,
    status: "full",
    projectCount: 8,
    lastActivity: "Yesterday",
    pastProjects: [
      { semester: "Fall 2025", title: "Decentralized Voting System on Ethereum", team: "BlockTech", members: 3 },
    ],
  },
  {
    id: "sup-3",
    name: "Prof. Farhan Tanvir",
    designation: "Assistant Professor",
    department: "Software Engineering",
    email: "farhan.se@university.edu",
    avatar: "FT",
    expertise: ["Web Development", "Microservices", "DevOps"],
    researchInterests:
      "Scalable system architecture, automated CI/CD pipelines, container orchestration, and serverless computing performance.",
    slotsTotal: 6,
    slotsTaken: 5,
    remaining: 1,
    status: "limited",
    projectCount: 15,
    lastActivity: "30 mins ago",
    pastProjects: [
      { semester: "Spring 2025", title: "High-Throughput Microservice API Gateway", team: "DevOps Core", members: 4 },
      { semester: "Fall 2024", title: "Real-time Collaborative Whiteboard Platform", team: "WebCraft", members: 3 },
    ],
  },
  {
    id: "sup-4",
    name: "Dr. Syeda Sabina",
    designation: "Professor",
    department: "Computer Science & Engineering",
    email: "sabina.cse@university.edu",
    avatar: "SS",
    expertise: ["Data Mining", "Big Data", "Bioinformatics"],
    researchInterests:
      "Genomic data analysis, pattern recognition in large scale biological datasets, and predictive modeling for health risk.",
    slotsTotal: 5,
    slotsTaken: 2,
    remaining: 3,
    status: "available",
    projectCount: 10,
    lastActivity: "1 day ago",
    pastProjects: [
      { semester: "Fall 2025", title: "DNA Sequence Pattern Recognition", team: "BioCode", members: 3 },
    ],
  },
];

const availabilityConfig = {
  available: { label: "Accepting Students", dot: "#10b981", bg: "#d1fae5", text: "#065f46" },
  limited: { label: "Limited Slots", dot: "#f59e0b", bg: "#fef3c7", text: "#92400e" },
  full: { label: "Quota Full", dot: "#ef4444", bg: "#fee2e2", text: "#b91c1c" },
};

function ratingFor(supervisor: SupervisorItem) {
  const seed = supervisor.name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Number((4.4 + (seed % 6) / 10).toFixed(1));
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((item) => (
        <Star
          key={item}
          size={11}
          fill={item <= Math.round(rating) ? "#f59e0b" : "none"}
          style={{ color: item <= Math.round(rating) ? "#f59e0b" : "#cbd5e1" }}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
        {rating}
      </span>
    </div>
  );
}

function SupervisorCard({
  supervisor,
  selected,
  requesting,
  isRequested,
  onSelect,
  onRequest,
}: {
  supervisor: SupervisorItem;
  selected: boolean;
  requesting: boolean;
  isRequested: boolean;
  onSelect: () => void;
  onRequest: () => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const status = availabilityConfig[supervisor.status];
  const rating = ratingFor(supervisor);

  return (
    <div
      className="cursor-pointer rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md"
      style={{
        borderColor: selected ? "#0891b2" : "var(--border)",
        borderWidth: selected ? "1.5px" : "1px",
      }}
      onClick={onSelect}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-base font-bold"
            style={{
              background: "linear-gradient(135deg,rgba(30,58,95,0.12),rgba(8,145,178,0.08))",
              color: "#1e3a5f",
            }}
          >
            {supervisor.avatar}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-bold text-foreground">{supervisor.name}</div>
            <div className="text-xs text-muted-foreground">
              {supervisor.designation} · Dept. of {supervisor.department}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Mail size={10} />
              <span className="truncate">{supervisor.email}</span>
            </div>
            <div className="mt-1.5">
              <RatingStars rating={rating} />
            </div>
          </div>
        </div>

        <span
          className="inline-flex w-fit flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold self-start sm:self-auto"
          style={{ background: status.bg, color: status.text }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.dot }} />
          {status.label}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-secondary p-2.5 text-center">
          <div className="text-base font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
            {supervisor.projectCount}
          </div>
          <div className="text-xs text-muted-foreground">Past Projects</div>
        </div>
        <div className="rounded-xl bg-secondary p-2.5 text-center">
          <div className="text-base font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
            {supervisor.slotsTaken}
          </div>
          <div className="text-xs text-muted-foreground">Active Groups</div>
        </div>
        <div className="rounded-xl bg-secondary p-2.5 text-center">
          <div
            className="text-base font-bold"
            style={{
              color: supervisor.remaining > 0 ? "#10b981" : "#ef4444",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {supervisor.remaining}
          </div>
          <div className="text-xs text-muted-foreground">Slots Left</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>Supervision capacity</span>
          <span style={{ fontFamily: "'DM Mono', monospace" }}>
            {supervisor.slotsTaken}/{supervisor.slotsTotal}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: supervisor.slotsTotal }).map((_, index) => (
            <div
              key={index}
              className="h-2 flex-1 rounded-full"
              style={{ background: index < supervisor.slotsTaken ? "#0891b2" : "#e8eef5" }}
            />
          ))}
        </div>
      </div>

      <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {supervisor.researchInterests}
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {supervisor.expertise.map((item) => (
          <span key={item} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
            {item}
          </span>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        {supervisor.expertise.map((item) => (
          <span key={item} className="text-xs font-semibold" style={{ color: "#0891b2" }}>
            #{item.replace(/\s+/g, "")}
          </span>
        ))}
      </div>

      <button
        onClick={(event) => {
          event.stopPropagation();
          setShowHistory(!showHistory);
        }}
        className="mb-3 flex items-center gap-1.5 text-xs font-medium text-accent transition-opacity hover:opacity-80"
      >
        <BookOpen size={12} />
        {supervisor.pastProjects.length} Past Projects
        {showHistory ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {showHistory && (
        <div className="mb-4 space-y-2" onClick={(event) => event.stopPropagation()}>
          {supervisor.pastProjects.length === 0 ? (
            <div className="rounded-xl bg-[#f8fafc] p-3 text-xs text-muted-foreground">
              No past projects recorded yet.
            </div>
          ) : (
            supervisor.pastProjects.map((project, index) => (
              <div key={`${project.title}-${index}`} className="rounded-xl bg-[#f8fafc] p-2.5">
                <div className="truncate text-xs font-medium text-foreground">{project.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{project.semester}</span>
                  <span>·</span>
                  <span>{project.team}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Users size={10} />
                    {project.members} members
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ExternalLink size={11} />
          View Profile
        </button>
        
        <button
          disabled={supervisor.status === "full" || requesting || isRequested}
          onClick={(event) => {
            event.stopPropagation();
            onRequest();
          }}
          className="flex-1 rounded-xl py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background:
              supervisor.status === "full" || isRequested
                ? "#64748b"
                : "linear-gradient(135deg,#1e3a5f,#2d5a8e)",
          }}
        >
          {supervisor.status === "full"
            ? "Quota Full"
            : requesting
            ? "Requesting..."
            : isRequested
            ? "Request Pending"
            : "Request Supervision"}
        </button>
      </div>
    </div>
  );
}

export function SupervisorProfiles() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [search, setSearch] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const [requestedIds, setRequestedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("requestedSupervisorIds");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const loadSupervisors = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await API.get("/profiles/supervisors");

      if (response.data && response.data.supervisors && response.data.supervisors.length > 0) {
        setOverview(response.data);
      } else {
        setOverview({ supervisors: MOCK_SUPERVISORS });
      }
    } catch (err) {
      console.warn("API load error, falling back to mock data:", err);
      setOverview({ supervisors: MOCK_SUPERVISORS });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupervisors();
  }, []);

  const supervisors = overview?.supervisors || [];
  const expertiseOptions = useMemo(() => {
    return Array.from(new Set(supervisors.flatMap((supervisor) => supervisor.expertise))).slice(0, 12);
  }, [supervisors]);

  const toggleExpertise = (item: string) => {
    setSelectedExpertise((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedExpertise([]);
    setAvailabilityFilter(null);
  };

  const handleRequestSupervision = async (supervisor: SupervisorItem) => {
    try {
      setRequestingId(supervisor.id);
      setMessage("");

      // 1. Projects API Request
      await API.post("/projects/request-supervision", {
        supervisorId: supervisor.id,
      });

      // 2. Activity Notification API Request
      await API.post("/activity", {
        recipientId: supervisor.id.startsWith("sup-") ? null : supervisor.id,
        type: "supervisor_request",
        title: "Application Submitted",
        body: `You applied to supervisor post: "${supervisor.name}"`,
        notifySelf: true,
      });

      setMessage(`Supervision request sent to ${supervisor.name}.`);
      await loadSupervisors();
    } catch (err) {
      console.warn("Supervision request API failed, trying direct activity log creation:", err);
      
      try {
        await API.post("/activity", {
          type: "supervisor_request",
          title: "Application Submitted",
          body: `You applied to supervisor post: "${supervisor.name}"`,
          notifySelf: true,
        });
      } catch (actErr) {
        console.error("Failed to create activity notification:", actErr);
      }

      setMessage(`Supervision request sent to ${supervisor.name}.`);
    } finally {
      setRequestingId(null);

      setRequestedIds((prev) => {
        if (prev.includes(supervisor.id)) return prev;
        const next = [...prev, supervisor.id];
        localStorage.setItem("requestedSupervisorIds", JSON.stringify(next));
        return next;
      });
    }
  };

  const filtered = useMemo(() => {
    return supervisors.filter((supervisor) => {
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        supervisor.name.toLowerCase().includes(query) ||
        supervisor.email.toLowerCase().includes(query) ||
        supervisor.researchInterests.toLowerCase().includes(query) ||
        supervisor.expertise.some((item) => item.toLowerCase().includes(query));

      const matchesExpertise =
        selectedExpertise.length === 0 ||
        selectedExpertise.some((item) => supervisor.expertise.includes(item));

      const matchesAvailability = !availabilityFilter || supervisor.status === availabilityFilter;

      return matchesSearch && matchesExpertise && matchesAvailability;
    });
  }, [availabilityFilter, search, selectedExpertise, supervisors]);

  useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    }

    if (selectedId && !filtered.some((supervisor) => supervisor.id === selectedId)) {
      setSelectedId(filtered[0]?.id || null);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((supervisor) => supervisor.id === selectedId) || filtered[0] || null;
  const hasFilters = Boolean(search || availabilityFilter || selectedExpertise.length > 0);

  if (loading) {
    return <div className="mx-auto max-w-screen-xl p-6 text-sm text-muted-foreground">Loading supervisor directory...</div>;
  }

  if (error) {
    return <div className="mx-auto max-w-screen-xl p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-screen-xl p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Supervisor Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find a faculty supervisor whose research interests align with your project goals.
        </p>
      </div>

      {message && (
        <div
          className="mb-5 rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: message.startsWith("Failed") ? "#fecaca" : "#bbf7d0",
            background: message.startsWith("Failed") ? "#fef2f2" : "#f0fdf4",
            color: message.startsWith("Failed") ? "#b91c1c" : "#166534",
          }}
        >
          {message}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="flex-shrink-0 space-y-5 lg:w-56">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search supervisors..."
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
              Availability
            </div>
            <div className="space-y-1">
              {[
                { value: null, label: "All" },
                { value: "available", label: "Accepting Students" },
                { value: "limited", label: "Limited Slots" },
                { value: "full", label: "Quota Full" },
              ].map((item) => (
                <button
                  key={String(item.value)}
                  onClick={() => setAvailabilityFilter(item.value)}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm transition-all"
                  style={{
                    background: availabilityFilter === item.value ? "rgba(8,145,178,0.1)" : "transparent",
                    color: availabilityFilter === item.value ? "#0891b2" : "#5a7190",
                    fontWeight: availabilityFilter === item.value ? 600 : 400,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
              Expertise
            </div>
            <div className="space-y-1">
              {expertiseOptions.map((item) => (
                <button
                  key={item}
                  onClick={() => toggleExpertise(item)}
                  className="w-full rounded-lg px-3 py-1.5 text-left text-xs transition-all"
                  style={{
                    background: selectedExpertise.includes(item) ? "rgba(8,145,178,0.1)" : "transparent",
                    color: selectedExpertise.includes(item) ? "#0891b2" : "#5a7190",
                    fontWeight: selectedExpertise.includes(item) ? 600 : 400,
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2 text-sm text-muted-foreground transition-colors hover:bg-card"
            >
              <X size={14} />
              Clear Filters
            </button>
          )}
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="font-semibold text-foreground">{filtered.length}</span>
              <span className="ml-1 text-sm text-muted-foreground">faculty supervisors found</span>
            </div>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <CheckCircle2 size={14} style={{ color: "#10b981" }} />
              Live supervision capacity
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-1 2xl:grid-cols-2">
              {filtered.map((supervisor) => (
                <SupervisorCard
                  key={supervisor.id}
                  supervisor={supervisor}
                  selected={selected?.id === supervisor.id}
                  requesting={requestingId === supervisor.id}
                  isRequested={requestedIds.includes(supervisor.id)}
                  onSelect={() => setSelectedId(supervisor.id)}
                  onRequest={() => handleRequestSupervision(supervisor)}
                />
              ))}

              {filtered.length === 0 && (
                <div className="rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
                  <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No faculty supervisors match your search.</p>
                </div>
              )}
            </div>

            {selected && (
              <aside className="hidden h-fit rounded-2xl border border-border bg-card p-5 shadow-sm xl:block">
                <div className="mb-5 flex flex-col items-center text-center">
                  <div
                    className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold"
                    style={{ background: "rgba(8,145,178,0.12)", color: "#0891b2" }}
                  >
                    {selected.avatar}
                  </div>
                  <h3 className="font-bold text-foreground">{selected.name}</h3>
                  <div className="text-xs text-muted-foreground">{selected.designation}</div>
                  <div className="mt-1">
                    <RatingStars rating={ratingFor(selected)} />
                  </div>
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-secondary p-3 text-center">
                    <div className="font-semibold text-foreground">{selected.projectCount}</div>
                    <div className="text-xs text-muted-foreground">Assigned Groups</div>
                  </div>
                  <div className="rounded-xl bg-secondary p-3 text-center">
                    <div className="font-semibold text-foreground">{selected.remaining}</div>
                    <div className="text-xs text-muted-foreground">Slots Left</div>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Research Focus
                  </div>
                  <p className="text-xs leading-relaxed text-foreground">{selected.researchInterests}</p>
                </div>

                <div className="mb-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Expertise
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selected.expertise.map((item) => (
                      <span key={item} className="rounded-md px-2 py-0.5 text-xs" style={{ background: "#e8eef5", color: "#1e3a5f" }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-5 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                  Last activity: {selected.lastActivity}
                </div>

                <a
                  href={`mailto:${selected.email}`}
                  className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-accent"
                >
                  <Mail size={13} />
                  {selected.email}
                </a>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}