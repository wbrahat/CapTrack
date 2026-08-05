import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, ThumbsUp, MessageCircle, Bookmark, ChevronRight, Users, Cpu, Search } from "lucide-react";
import { toast } from "sonner";

type FeedPost = {
  id: string | number;
  _id?: string;
  type: "supervisor" | "student";
  isSupervisorPost?: boolean;
  postType?: "supervisor_recruitment" | "student_team_up";
  author: string;
  authorRole: string;
  avatar: string;
  time: string;
  title: string;
  body: string;
  skills: string[];
  likes: number;
  comments: number;
  saved: boolean;
  liked?: boolean;
  joined?: boolean;
  requested?: boolean;
  projectTopic?: string;
  researchArea?: string;
  teamSize?: string;
  projectIdea?: string;
  currentTeamSize?: string;
  lookingFor?: string;
  commentItems?: Array<{ id: string | number; authorName: string; text: string }>;
};

const initialPosts: FeedPost[] = [
  {
    id: 1,
    type: "supervisor",
    author: "Ahmed Adnan",
    authorRole: "Lecturer, CSE",
    avatar: "AA",
    time: "2 hours ago",
    title: "Looking for a team to build a Capstone Project Lifecycle Management System",
    body: "I am seeking a group of 5–6 motivated students for a project focused on web-based capstone management. The system will manage student profiling, team formation, progress tracking, and evaluation workflows. Students should have prior experience with full-stack web development.",
    projectTopic: "Web-Based Project Management Platform",
    researchArea: "Software Engineering & Educational Technology",
    teamSize: "5–6 students",
    skills: ["React", "Node.js", "PostgreSQL", "REST APIs", "UI/UX"],
    likes: 24,
    comments: 8,
    saved: false,
  },
  {
    id: 2,
    type: "student",
    author: "Arif Hossain",
    authorRole: "Student · 2023-1-60-112",
    avatar: "AH",
    time: "5 hours ago",
    title: "Team of 4 seeking 1 more — AI Chatbot for Student Support",
    body: "We are building an intelligent chatbot that can answer student queries about university regulations, course registrations, and academic policies. We currently have 4 members and need 1 more with experience in NLP or LLM fine-tuning.",
    projectIdea: "University AI Support Chatbot",
    currentTeamSize: "4 / 5",
    lookingFor: "NLP Engineer",
    skills: ["Python", "LangChain", "NLP", "FastAPI", "React"],
    likes: 17,
    comments: 5,
    saved: true,
  }
];

type PostType = "all" | "supervisor" | "student";

type CreatePostForm = {
  title: string;
  body: string;
  topic: string;
  teamSize: string;
  skills: string;
};

const createPostConfig = {
  supervisor: {
    title: "Post a Project Opportunity",
    bodyPlaceholder: "Describe the intended project, research area, and any additional prerequisites...",
    topicPlaceholder: "Research Area / Project Topic",
    teamSizePlaceholder: "Expected Team Size",
    skillsPlaceholder: "Required Technical Skills (comma separated)",
    postType: "supervisor_recruitment" as const,
    isSupervisorPost: true,
  },
  student: {
    title: "Post a Team-Up Request",
    bodyPlaceholder: "Outline your overarching project idea, preferred technologies, and what you are looking for in a new member...",
    topicPlaceholder: "Overarching Project Idea",
    teamSizePlaceholder: "Current Team Size & Slots Needed",
    skillsPlaceholder: "Specific Skills Needed (comma separated)",
    postType: "student_team_up" as const,
    isSupervisorPost: false,
  },
};

const API = axios.create({
  baseURL: "https://captrack-backend.onrender.com/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers["x-auth-token"] = token;
  }

  return config;
});

export function CollaborationFeed({ viewerRole = "student" }: { viewerRole?: string }) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [filter, setFilter] = useState<PostType>("all");
  const [search, setSearch] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string | number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string | number>>(new Set([2]));
  const [showCreate, setShowCreate] = useState(false);
  const [joinedIds, setJoinedIds] = useState<Set<string | number>>(new Set());
  const [requestedIds, setRequestedIds] = useState<Set<string | number>>(new Set());
  const [commentCounts, setCommentCounts] = useState<Record<string | number, number>>(
    initialPosts.reduce<Record<string | number, number>>((accumulator, post) => {
      accumulator[post.id] = post.comments;
      return accumulator;
    }, {})
  );
  const [activeThreadId, setActiveThreadId] = useState<string | number | null>(null);
  const [threadDraft, setThreadDraft] = useState("");
  const [createForm, setCreateForm] = useState<CreatePostForm>({
    title: "",
    body: "",
    topic: "",
    teamSize: "",
    skills: "",
  });
  const postConfig = viewerRole === "supervisor" ? createPostConfig.supervisor : createPostConfig.student;

  const normalizePost = (post: any): FeedPost => ({
    ...post,
    id: post._id || post.id,
  });

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const response = await API.get("/feed");
        const apiPosts = (response.data?.posts || []).map((post: any) => normalizePost(post));
        setPosts(apiPosts);
        setLikedIds(new Set(apiPosts.filter((post: FeedPost) => post.liked).map((post: FeedPost) => post.id)));
        setSavedIds(new Set(apiPosts.filter((post: FeedPost) => post.saved).map((post: FeedPost) => post.id)));
        setJoinedIds(new Set(apiPosts.filter((post: FeedPost) => post.joined).map((post: FeedPost) => post.id)));
        setRequestedIds(new Set(apiPosts.filter((post: FeedPost) => post.requested).map((post: FeedPost) => post.id)));
        setCommentCounts(
          apiPosts.reduce<Record<string | number, number>>((accumulator: Record<string | number, number>, post: FeedPost) => {
            accumulator[post.id] = post.comments;
            return accumulator;
          }, {})
        );
      } catch (error) {
        console.error("Failed to load collaboration feed:", error);
        toast.error("Failed to load collaboration feed from the server.");
      }
    };

    loadFeed();
  }, []);

  const syncPost = (updatedPost: any) => {
    const normalizedPost = normalizePost(updatedPost);

    setPosts((previous) => previous.map((post) => (String(post.id) === String(normalizedPost.id) ? normalizedPost : post)));

    setLikedIds((previous) => {
      const next = new Set(previous);
      normalizedPost.liked ? next.add(normalizedPost.id) : next.delete(normalizedPost.id);
      return next;
    });

    setSavedIds((previous) => {
      const next = new Set(previous);
      normalizedPost.saved ? next.add(normalizedPost.id) : next.delete(normalizedPost.id);
      return next;
    });

    setJoinedIds((previous) => {
      const next = new Set(previous);
      normalizedPost.joined ? next.add(normalizedPost.id) : next.delete(normalizedPost.id);
      return next;
    });

    setRequestedIds((previous) => {
      const next = new Set(previous);
      normalizedPost.requested ? next.add(normalizedPost.id) : next.delete(normalizedPost.id);
      return next;
    });

    setCommentCounts((previous) => ({
      ...previous,
      [normalizedPost.id]: normalizedPost.comments,
    }));
  };

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const matchType = filter === "all" || post.type === filter;
      const matchSearch =
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.body.toLowerCase().includes(search.toLowerCase()) ||
        post.skills.some((skill) => skill.toLowerCase().includes(search.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [posts, filter, search]);

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      body: "",
      topic: "",
      teamSize: "",
      skills: "",
    });
  };

  const publishPost = () => {
    if (!createForm.title.trim() || !createForm.body.trim()) {
      toast.error("Add a title and description before publishing.");
      return;
    }

    const payload = {
      title: createForm.title.trim(),
      body: createForm.body.trim(),
      topic: createForm.topic.trim(),
      teamSize: createForm.teamSize.trim(),
      skills: createForm.skills.trim(),
      isSupervisorPost: postConfig.isSupervisorPost,
      postType: postConfig.postType,
    };

    API.post("/feed", payload)
      .then((response) => {
        const createdPost = response.data?.post;
        if (createdPost) {
          const normalizedPost = normalizePost(createdPost);
          setPosts((previous) => [normalizedPost, ...previous]);
          setCommentCounts((previous) => ({ ...previous, [normalizedPost.id]: normalizedPost.comments }));
          setShowCreate(false);
          resetCreateForm();
          toast.success("Post published to MongoDB.");
        }
      })
      .catch((error) => {
        console.error("Failed to publish post:", error);
        toast.error("Failed to publish post.");
      });
  };

  const handlePrimaryAction = (post: FeedPost) => {
    const action = post.type === "supervisor" ? "request" : "join";

    API.post(`/feed/${post.id}/action`, { action })
      .then((response) => {
        const updatedPost = response.data?.post;
        if (updatedPost) {
          syncPost(updatedPost);
          toast.success(post.type === "supervisor" ? "Request updated." : "Join request sent.");
        }
      })
      .catch((error) => {
        console.error("Failed to update collaboration action:", error);
        toast.error("Failed to update the post action.");
      });
  };

  const submitComment = (postId: string | number) => {
    const text = threadDraft.trim();
    if (!text) {
      toast.error("Write a comment before sending.");
      return;
    }

    API.post(`/feed/${postId}/comments`, { text })
      .then((response) => {
        const updatedPost = response.data?.post;
        if (updatedPost) {
          syncPost(updatedPost);
          setThreadDraft("");
          setActiveThreadId(null);
          toast.success("Comment saved to MongoDB.");
        }
      })
      .catch((error) => {
        console.error("Failed to save comment:", error);
        toast.error("Failed to save comment.");
      });
  };

  const toggleLike = (id: string | number) => {
    API.post(`/feed/${id}/like`)
      .then((response) => {
        const updatedPost = response.data?.post;
        if (updatedPost) {
          syncPost(updatedPost);
        }
      })
      .catch((error) => {
        console.error("Failed to update like state:", error);
        toast.error("Failed to update like state.");
      });
  };

  const toggleSave = (id: string | number) => {
    API.post(`/feed/${id}/save`)
      .then((response) => {
        const updatedPost = response.data?.post;
        if (updatedPost) {
          syncPost(updatedPost);
        }
      })
      .catch((error) => {
        console.error("Failed to update save state:", error);
        toast.error("Failed to update save state.");
      });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>Collaboration Feed</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Supervisor recruitment posts and student team-up requests
          </p>
        </div>
        {viewerRole !== "admin" && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "#1e3a5f" }}
          >
            <Plus size={16} />
            Create Post
          </button>
        )}
      </div>

      {/* Create post */}
      {showCreate && (
        <div className="bg-card rounded-xl border border-border p-5 mb-5">
          <h3 className="text-foreground mb-4">
            {postConfig.title}
          </h3>
          <div className="space-y-3">
            <input
              value={createForm.title}
              onChange={(event) => setCreateForm((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Post title..."
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30"
            />
            <textarea
              value={createForm.body}
              onChange={(event) => setCreateForm((previous) => ({ ...previous, body: event.target.value }))}
              placeholder={postConfig.bodyPlaceholder}
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={createForm.topic}
                onChange={(event) => setCreateForm((previous) => ({ ...previous, topic: event.target.value }))}
                placeholder={postConfig.topicPlaceholder}
                className="px-4 py-2.5 rounded-lg border border-border bg-secondary text-sm text-foreground outline-none"
              />
              <input
                value={createForm.teamSize}
                onChange={(event) => setCreateForm((previous) => ({ ...previous, teamSize: event.target.value }))}
                placeholder={postConfig.teamSizePlaceholder}
                className="px-4 py-2.5 rounded-lg border border-border bg-secondary text-sm text-foreground outline-none"
              />
            </div>
            <input
              value={createForm.skills}
              onChange={(event) => setCreateForm((previous) => ({ ...previous, skills: event.target.value }))}
              placeholder={postConfig.skillsPlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-sm text-foreground outline-none"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button onClick={publishPost} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#0891b2" }}>
                Publish Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts by title, skill, or keyword..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
          {(["all", "supervisor", "student"] as PostType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all"
              style={{
                background: filter === f ? "#1e3a5f" : "transparent",
                color: filter === f ? "#fff" : "#5a7190",
              }}
            >
              {f === "all" ? "All Posts" : f === "supervisor" ? "Supervisor" : "Student"}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filtered.map((post) => {
          const isRequested = requestedIds.has(post.id) || joinedIds.has(post.id);

          return (
            <div key={post.id} className="bg-card rounded-xl border border-border p-5">
              {/* Post header */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: post.type === "supervisor" ? "rgba(30,58,95,0.1)" : "rgba(8,145,178,0.1)",
                    color: post.type === "supervisor" ? "#1e3a5f" : "#0891b2",
                  }}
                >
                  {post.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{post.author}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: post.type === "supervisor" ? "rgba(30,58,95,0.08)" : "rgba(8,145,178,0.08)",
                        color: post.type === "supervisor" ? "#1e3a5f" : "#0891b2",
                      }}
                    >
                      {post.type === "supervisor" ? "Supervisor" : "Student"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{post.authorRole} · {post.time}</div>
                </div>
              </div>

              <h3 className="text-foreground mb-2">{post.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{post.body}</p>

              {/* Meta grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {post.type === "supervisor" ? (
                  <>
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-0.5">Project Topic</div>
                      <div className="text-xs font-medium text-foreground">{(post as any).projectTopic}</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-0.5">Research Area</div>
                      <div className="text-xs font-medium text-foreground">{(post as any).researchArea}</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Users size={10} />Team Size</div>
                      <div className="text-xs font-medium text-foreground">{(post as any).teamSize}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-0.5">Project Idea</div>
                      <div className="text-xs font-medium text-foreground">{(post as any).projectIdea}</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Users size={10} />Current Size</div>
                      <div className="text-xs font-medium text-foreground">{(post as any).currentTeamSize}</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Cpu size={10} />Looking For</div>
                      <div className="text-xs font-medium text-foreground">{(post as any).lookingFor}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {post.skills.map((skill) => (
                  <span key={skill} className="text-xs px-2 py-0.5 rounded-md border border-border text-muted-foreground">
                    {skill}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <button
                  onClick={() => toggleLike(post.id)}
                  className="flex items-center gap-1.5 text-xs transition-colors"
                  style={{ color: likedIds.has(post.id) ? "#0891b2" : "#5a7190" }}
                >
                  <ThumbsUp size={14} />
                  {post.likes}
                </button>
                <button
                  onClick={() => setActiveThreadId(activeThreadId === post.id ? null : post.id)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle size={14} />
                  {commentCounts[post.id] ?? post.comments} Comments
                </button>
                <button
                  onClick={() => toggleSave(post.id)}
                  className="flex items-center gap-1.5 text-xs transition-colors"
                  style={{ color: savedIds.has(post.id) ? "#f59e0b" : "#5a7190" }}
                >
                  <Bookmark size={14} fill={savedIds.has(post.id) ? "#f59e0b" : "none"} />
                  {savedIds.has(post.id) ? "Saved" : "Save"}
                </button>
                <div className="flex-1" />
                {viewerRole !== "admin" && (
                  <button
                    onClick={() => handlePrimaryAction(post)}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                    style={{
                      background: isRequested
                        ? "#475569"
                        : post.type === "supervisor"
                        ? "#1e3a5f"
                        : "#0891b2",
                    }}
                  >
                    {post.type === "supervisor"
                      ? requestedIds.has(post.id)
                        ? "Request Sent"
                        : "Apply to Group"
                      : isRequested
                      ? "Requested to Join"
                      : "Join Team"}
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>

              {activeThreadId === post.id && (
                <div className="mt-4 rounded-xl border border-border bg-secondary p-4">
                  <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Add a comment
                  </div>
                  <div className="mb-3 space-y-2">
                    {(post.commentItems || []).map((comment) => (
                      <div key={comment.id} className="rounded-lg bg-card px-3 py-2 text-xs text-foreground">
                        <div className="font-semibold text-slate-700">{comment.authorName}</div>
                        <div className="mt-1 leading-5 text-slate-600">{comment.text}</div>
                      </div>
                    ))}
                  </div>
                  <textarea
                    value={threadDraft}
                    onChange={(event) => setThreadDraft(event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                    placeholder="Write your message..."
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveThreadId(null);
                        setThreadDraft("");
                      }}
                      className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => submitComment(post.id)}
                      className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                    >
                      Send Comment
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p>No posts match your search.</p>
        </div>
      )}
    </div>
  );
}