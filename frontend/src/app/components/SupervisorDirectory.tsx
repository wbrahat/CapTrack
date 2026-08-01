import { useState } from "react";
import { Search, Mail, BookOpen, Users, CheckCircle2, XCircle, ChevronDown, ChevronUp, ExternalLink, Star, X } from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const supervisors = [
  {
    id: "sup-001", name: "Ahmed Adnan", designation: "Lecturer", department: "CSE",
    email: "ahmed.adnan@ewubd.edu", avatar: "AA",
    expertise: ["Web Engineering", "Software Architecture", "Cloud Computing", "API Design"],
    researchInterests: "Full-stack web application development, cloud-native architectures, API-driven systems design, and educational technology platforms.",
    slotsTotal: 5, slotsTaken: 3, status: "available",
    previousProjects: 6, ongoingGroups: 3,
    pastProjects: [
      { semester: "Spring 2025", title: "LearnBridge: Adaptive E-Learning Platform", team: "Group 3" },
      { semester: "Fall 2024", title: "MediConnect: Hospital Resource Management", team: "Group 7" },
      { semester: "Spring 2024", title: "AgriSense: IoT Crop Monitoring System", team: "Group 2" },
    ],
    domains: ["Software Engineering", "EdTech", "Cloud"],
    rating: 4.8,
  },
  {
    id: "sup-002", name: "Dr. Tasmin Jahan", designation: "Associate Professor", department: "CSE",
    email: "tasmin.jahan@ewubd.edu", avatar: "TJ",
    expertise: ["Machine Learning", "Computer Vision", "NLP", "Deep Learning"],
    researchInterests: "Deep learning for image recognition, natural language understanding, AI in healthcare systems, and transformer-based language models.",
    slotsTotal: 4, slotsTaken: 4, status: "full",
    previousProjects: 9, ongoingGroups: 4,
    pastProjects: [
      { semester: "Spring 2025", title: "VisionAid: Assistive App for the Visually Impaired", team: "Group 1" },
      { semester: "Fall 2024", title: "SentimentScope: Social Media Analyzer", team: "Group 5" },
    ],
    domains: ["Machine Learning", "AI", "Healthcare IT"],
    rating: 4.9,
  },
  {
    id: "sup-003", name: "Dr. Nazmul Karim", designation: "Professor", department: "CSE",
    email: "nazmul.karim@ewubd.edu", avatar: "NK",
    expertise: ["Cybersecurity", "Network Security", "Cryptography", "Digital Forensics"],
    researchInterests: "Secure communication protocols, ethical hacking frameworks, digital forensics methodologies, and federated learning for privacy-preserving systems.",
    slotsTotal: 3, slotsTaken: 1, status: "available",
    previousProjects: 12, ongoingGroups: 1,
    pastProjects: [
      { semester: "Spring 2025", title: "SecureVault: Encrypted File Sharing System", team: "Group 9" },
      { semester: "Fall 2024", title: "NetGuard: Intrusion Detection System", team: "Group 4" },
      { semester: "Spring 2024", title: "CipherChat: End-to-End Encrypted Messaging", team: "Group 6" },
    ],
    domains: ["Cybersecurity", "IoT", "Federated Learning"],
    rating: 4.7,
  },
  {
    id: "sup-004", name: "Dr. Farzana Haque", designation: "Assistant Professor", department: "CSE",
    email: "farzana.haque@ewubd.edu", avatar: "FH",
    expertise: ["Data Science", "Big Data", "Business Intelligence", "ETL Pipelines"],
    researchInterests: "Predictive analytics for business intelligence, large-scale data pipeline design, visualization frameworks, and data engineering for real-time systems.",
    slotsTotal: 4, slotsTaken: 2, status: "available",
    previousProjects: 7, ongoingGroups: 2,
    pastProjects: [
      { semester: "Spring 2025", title: "InsightHub: Real-Time Analytics Dashboard", team: "Group 11" },
      { semester: "Fall 2024", title: "DataBridge: ETL Pipeline for SMEs", team: "Group 8" },
    ],
    domains: ["Data Science", "Business Analytics", "Big Data"],
    rating: 4.6,
  },
  {
    id: "sup-005", name: "Md. Rafiqul Islam", designation: "Senior Lecturer", department: "CSE",
    email: "rafiqul.islam@ewubd.edu", avatar: "RI",
    expertise: ["Mobile Development", "Cross-Platform Apps", "IoT", "React Native"],
    researchInterests: "Cross-platform mobile frameworks, IoT device integration, smart city application prototyping, and real-time sensor data processing.",
    slotsTotal: 5, slotsTaken: 2, status: "available",
    previousProjects: 8, ongoingGroups: 2,
    pastProjects: [
      { semester: "Spring 2025", title: "CityPulse: Smart City Monitoring App", team: "Group 2" },
      { semester: "Fall 2024", title: "TrackRide: Public Transport Tracker", team: "Group 10" },
    ],
    domains: ["Mobile Dev", "IoT", "Smart City"],
    rating: 4.5,
  },
  {
    id: "sup-006", name: "Dr. Sadia Sultana", designation: "Associate Professor", department: "CSE",
    email: "sadia.sultana@ewubd.edu", avatar: "SS",
    expertise: ["Robotics", "Human-Computer Interaction", "Computer Vision", "AI"],
    researchInterests: "Autonomous robotic systems, human-robot interaction design, affective computing, and assistive technologies for healthcare.",
    slotsTotal: 4, slotsTaken: 2, status: "available",
    previousProjects: 10, ongoingGroups: 2,
    pastProjects: [
      { semester: "Spring 2025", title: "RoboCare: Assistive Robot for Elderly Care", team: "Group 4" },
      { semester: "Fall 2024", title: "GestureDrive: Wheelchair Control using Hand Gestures", team: "Group 12" },
    ],
    domains: ["AI", "Healthcare IT", "Software Engineering"],
    rating: 4.9,
  },
  {
    id: "sup-007", name: "Tanvir Hossain", designation: "Lecturer", department: "CSE",
    email: "tanvir.hossain@ewubd.edu", avatar: "TH",
    expertise: ["Blockchain", "Distributed Systems", "Smart Contracts", "Cryptography"],
    researchInterests: "Decentralized finance systems, smart contract verification, privacy in blockchain networks, and distributed consensus mechanisms.",
    slotsTotal: 5, slotsTaken: 5, status: "full",
    previousProjects: 5, ongoingGroups: 4,
    pastProjects: [
      { semester: "Spring 2025", title: "BlockVote: Tamper-Proof Electronic Voting System", team: "Group 8" },
      { semester: "Fall 2024", title: "ChainTrack: Supply Chain Verification Platform", team: "Group 3" },
    ],
    domains: ["Cybersecurity", "Cloud", "Software Engineering"],
    rating: 4.7,
  },
  {
    id: "sup-008", name: "Dr. Mahbubur Rahman", designation: "Professor", department: "CSE",
    email: "mahbubur.rahman@ewubd.edu", avatar: "MR",
    expertise: ["Bioinformatics", "Medical Imaging", "Signal Processing", "Deep Learning"],
    researchInterests: "Genomic data analysis, cancer diagnosis using deep learning on MRI images, and biomedical signal filtering.",
    slotsTotal: 4, slotsTaken: 1, status: "available",
    previousProjects: 15, ongoingGroups: 1,
    pastProjects: [
      { semester: "Spring 2025", title: "BioGene: Genomic Sequence Alignment Tool", team: "Group 10" },
      { semester: "Fall 2024", title: "NeuroScan: Tumor Detection from Brain MRI", team: "Group 1" },
    ],
    domains: ["Healthcare IT", "Machine Learning", "Data Science"],
    rating: 4.8,
  },
  {
    id: "sup-009", name: "Nusrat Jahan", designation: "Senior Lecturer", department: "CSE",
    email: "nusrat.jahan@ewubd.edu", avatar: "NJ",
    expertise: ["UI/UX Design", "AR/VR", "Educational Tech", "Mobile Dev"],
    researchInterests: "Virtual reality simulation for medical training, user experience evaluation methodologies, and immersive learning environments.",
    slotsTotal: 4, slotsTaken: 3, status: "available",
    previousProjects: 8, ongoingGroups: 3,
    pastProjects: [
      { semester: "Spring 2025", title: "VRLab: Virtual Physics Laboratory for Schools", team: "Group 5" },
      { semester: "Fall 2024", title: "AR-Tour: Campus Augmented Reality Navigation", team: "Group 6" },
    ],
    domains: ["EdTech", "Mobile Dev", "Software Engineering"],
    rating: 4.6,
  },
];

const allDomains = ["Software Engineering", "Machine Learning", "Cybersecurity", "Data Science", "Mobile Dev", "IoT", "EdTech", "Cloud", "AI", "Healthcare IT"];
const allDesignations = ["Lecturer", "Senior Lecturer", "Assistant Professor", "Associate Professor", "Professor"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slotStatusConfig = {
  available: { label: "Accepting Students", dot: "#10b981", bg: "#d1fae5", text: "#065f46" },
  full: { label: "Quota Full", dot: "#ef4444", bg: "#fee2e2", text: "#b91c1c" },
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={11} fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
          style={{ color: i <= Math.round(rating) ? "#f59e0b" : "#cbd5e1" }} />
      ))}
      <span className="text-xs text-muted-foreground ml-1" style={{ fontFamily: "'DM Mono', monospace" }}>{rating}</span>
    </div>
  );
}

function SupervisorCard({ sup, onSelect, selected }: { sup: typeof supervisors[0]; onSelect: () => void; selected: boolean }) {
  const [showHistory, setShowHistory] = useState(false);
  const remaining = sup.slotsTotal - sup.slotsTaken;
  const sc = slotStatusConfig[sup.status as keyof typeof slotStatusConfig];

  return (
    <div
      className="bg-card rounded-2xl border shadow-sm p-5 transition-all cursor-pointer hover:shadow-md"
      style={{ borderColor: selected ? "#0891b2" : "var(--border)", borderWidth: selected ? "1.5px" : "1px" }}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg,rgba(30,58,95,0.12),rgba(8,145,178,0.08))", color: "#1e3a5f" }}>
          {sup.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-foreground">{sup.name}</div>
              <div className="text-xs text-muted-foreground">{sup.designation} · Dept. of {sup.department}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Mail size={10} />{sup.email}
              </div>
            </div>
          </div>
          <div className="mt-1.5">
            <RatingStars rating={sup.rating} />
          </div>
        </div>
        <span
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
          style={{ background: sc.bg, color: sc.text }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
          {sc.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-secondary rounded-xl p-2.5 text-center">
          <div className="font-bold text-foreground text-base" style={{ fontFamily: "'DM Mono', monospace" }}>{sup.previousProjects}</div>
          <div className="text-xs text-muted-foreground">Past Projects</div>
        </div>
        <div className="bg-secondary rounded-xl p-2.5 text-center">
          <div className="font-bold text-foreground text-base" style={{ fontFamily: "'DM Mono', monospace" }}>{sup.ongoingGroups}</div>
          <div className="text-xs text-muted-foreground">Active Groups</div>
        </div>
        <div className="bg-secondary rounded-xl p-2.5 text-center">
          <div className="font-bold text-base" style={{ color: remaining > 0 ? "#10b981" : "#ef4444", fontFamily: "'DM Mono', monospace" }}>{remaining}</div>
          <div className="text-xs text-muted-foreground">Slots Left</div>
        </div>
      </div>

      {/* Slot visual */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Supervision capacity</span>
          <span style={{ fontFamily: "'DM Mono', monospace" }}>{sup.slotsTaken}/{sup.slotsTotal}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: sup.slotsTotal }).map((_, i) => (
            <div key={i} className="flex-1 h-2 rounded-full"
              style={{ background: i < sup.slotsTaken ? "#0891b2" : "#e8eef5" }} />
          ))}
        </div>
      </div>

      {/* Research interests */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{sup.researchInterests}</p>

      {/* Expertise tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {sup.expertise.map((e) => (
          <span key={e} className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground">
            {e}
          </span>
        ))}
      </div>

      {/* Domain badges */}
      <div className="flex flex-wrap gap-1 mb-4">
        {sup.domains.map((d) => (
          <span key={d} className="text-xs font-semibold" style={{ color: "#0891b2" }}>#{d.replace(" ", "")}</span>
        ))}
      </div>

      {/* Past projects toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
        className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80 transition-opacity font-medium mb-3"
      >
        <BookOpen size={12} />
        {sup.pastProjects.length} Past Projects
        {showHistory ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {showHistory && (
        <div className="space-y-2 mb-4" onClick={(e) => e.stopPropagation()}>
          {sup.pastProjects.map((p, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: "#f8fafc" }}>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{p.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>{p.semester}</span>·<span>{p.team}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="flex gap-2">
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex-1 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-1"
        >
          <ExternalLink size={11} /> View Profile
        </button>
        <button
          disabled={sup.status === "full"}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: sup.status === "full" ? "#94a3b8" : "linear-gradient(135deg,#1e3a5f,#2d5a8e)" }}
        >
          {sup.status === "full" ? "Quota Full" : "Request Supervision"}
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SupervisorDirectory() {
  const [search, setSearch] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedDesignation, setSelectedDesignation] = useState<string | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleDomain = (d: string) => {
    setSelectedDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const clearFilters = () => {
    setSelectedDomains([]);
    setSelectedDesignation(null);
    setAvailabilityFilter(null);
    setSearch("");
  };

  const filtered = supervisors.filter((s) => {
    const matchSearch = !search
      || s.name.toLowerCase().includes(search.toLowerCase())
      || s.expertise.some((e) => e.toLowerCase().includes(search.toLowerCase()))
      || s.researchInterests.toLowerCase().includes(search.toLowerCase());
    const matchDomain = selectedDomains.length === 0 || selectedDomains.some(d => s.domains.some(sd => sd.includes(d) || d.includes(sd)));
    const matchDesignation = !selectedDesignation || s.designation === selectedDesignation;
    const matchAvailability = !availabilityFilter || s.status === availabilityFilter;
    return matchSearch && matchDomain && matchDesignation && matchAvailability;
  });

  const hasFilters = selectedDomains.length > 0 || selectedDesignation || availabilityFilter;

  return (
    <div className="p-6 max-w-screen-xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Supervisor Directory</h1>
        <p className="text-sm text-muted-foreground mt-1">Find a supervisor whose research interests align with your project goals</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Filter sidebar ── */}
        <div className="lg:w-56 flex-shrink-0 space-y-5">

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supervisors..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {/* Availability */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
              Availability
            </div>
            <div className="space-y-1">
              {[null, "available", "full"].map((v) => (
                <button key={String(v)} onClick={() => setAvailabilityFilter(v)}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm transition-all"
                  style={{
                    background: availabilityFilter === v ? "rgba(8,145,178,0.1)" : "transparent",
                    color: availabilityFilter === v ? "#0891b2" : "#5a7190",
                    fontWeight: availabilityFilter === v ? 600 : 400,
                  }}>
                  {v === null ? "All" : v === "available" ? "Accepting Students" : "Quota Full"}
                </button>
              ))}
            </div>
          </div>

          {/* Designation */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
              Designation
            </div>
            <div className="space-y-1">
              {allDesignations.map((d) => (
                <button key={d} onClick={() => setSelectedDesignation(selectedDesignation === d ? null : d)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={{
                    background: selectedDesignation === d ? "rgba(8,145,178,0.1)" : "transparent",
                    color: selectedDesignation === d ? "#0891b2" : "#5a7190",
                    fontWeight: selectedDesignation === d ? 600 : 400,
                  }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Research domain */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
              Research Domain
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allDomains.map((d) => (
                <button key={d} onClick={() => toggleDomain(d)}
                  className="text-xs px-2.5 py-1 rounded-full border transition-all"
                  style={{
                    background: selectedDomains.includes(d) ? "#0891b2" : "transparent",
                    color: selectedDomains.includes(d) ? "#fff" : "#5a7190",
                    borderColor: selectedDomains.includes(d) ? "#0891b2" : "var(--border)",
                  }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 py-2">
              <X size={11} /> Clear all filters
            </button>
          )}
        </div>

        {/* ── Cards grid ── */}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-4">{filtered.length} supervisor{filtered.length !== 1 ? "s" : ""} found</p>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filtered.map((sup) => (
              <SupervisorCard
                key={sup.id}
                sup={sup}
                selected={selectedId === sup.id}
                onSelect={() => setSelectedId(selectedId === sup.id ? null : sup.id)}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground bg-card rounded-2xl border border-border">
              <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">No supervisors match your search</p>
              <button onClick={clearFilters} className="mt-2 text-xs text-accent hover:opacity-80">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}