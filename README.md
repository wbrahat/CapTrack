# CapTrack — Capstone Project Lifecycle Management System

<p align="center">
  <img src="https://img.shields.io/badge/East_West_University-CSE-0f5f8f?style=for-the-badge" alt="EWU CSE"/>
  <img src="https://img.shields.io/badge/MERN-Stack-10b981?style=for-the-badge" alt="MERN"/>
  <img src="https://img.shields.io/badge/Status-Active_Development-0891b2?style=for-the-badge" alt="Status"/>
</p>

**CapTrack** is a full-stack web platform that manages the **entire undergraduate capstone project lifecycle** at East West University — from student profiling and team formation, through supervisor matching, milestone tracking, submissions, and feedback, to departmental oversight.

It replaces fragmented workflows (email, Facebook groups, Drive folders, spreadsheets) with one role-aware system for **Students**, **Supervisors**, and **Administrators**.

---

## Live Demo

| Layer | URL |
|--------|-----|
| **Frontend** | [https://captrack-frontend.onrender.com](https://captrack-frontend.onrender.com/) |
| **Backend API** | [https://captrack-backend.onrender.com](https://captrack-backend.onrender.com/) |

> Student accounts use `@std.ewubd.edu` · Faculty / supervisor accounts use `@ewubd.edu`

<p align="center">
  <img src="./docs/login-preview.png" alt="CapTrack Login" width="860"/>
  <br/>
  <em>Figure 1 — CapTrack login screen (university-branded student / faculty entry)</em>
</p>

---

## Table of Contents

1. [Problem Statement](#-problem-statement)
2. [Objectives](#-objectives)
3. [System Overview](#-system-overview)
4. [User Roles & Modules](#-user-roles--modules)
5. [Architecture](#-architecture)
6. [Tech Stack](#-tech-stack)
7. [Repository Structure](#-repository-structure)
8. [API Surface (High Level)](#-api-surface-high-level)
9. [Local Setup](#-local-setup)
10. [Environment Variables](#-environment-variables)
11. [Deployment (Render)](#-deployment-render)
12. [Team](#-team)
13. [Academic Context](#-academic-context)
14. [License](#-license)

---

## Problem Statement

Final-year capstone work is central to a CSE degree, but the supporting process is usually **scattered**:

| Pain point | What happens today |
|------------|-------------------|
| Team formation | Students rely on friends / social media; skill mismatch is common |
| Supervisor matching | No single view of faculty research areas, open slots, or past groups |
| Communication | Chat apps + email + Drive links; no audit trail |
| Progress tracking | Deadlines and feedback live in personal notes or sheets |
| Department oversight | Manual workload balancing; weak visibility into group status |

**CapTrack** centralizes these steps so students, supervisors, and admins share the same source of truth.

---

## Objectives

1. Provide a **centralized** platform for capstone management  
2. Support **student–student** and **student–supervisor** matching  
3. Maintain a **faculty repository** (expertise, slots, past projects)  
4. Improve structured **communication** among all roles  
5. Enable **task / milestone** tracking and accountability  
6. Let supervisors **review, feedback, and approve** work in one place  

---

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         CapTrack Platform                                │
├──────────────┬──────────────────────────┬───────────────────────────────┤
│   STUDENT    │       SUPERVISOR         │            ADMIN              │
│              │                          │                               │
│ • Profile    │ • Slot capacity          │ • User management             │
│ • Find team  │ • Accept / reject req.   │ • Semester CRUD               │
│ • Request    │ • Review submissions     │ • Department-wide             │
│   supervisor │ • Feedback & approve     │   submissions & projects      │
│ • Workspace  │ • Milestone oversight    │ • Workload visibility         │
│ • Submit     │ • Group progress         │ • Archive                     │
│ • Feedback   │ • Collaboration posts    │                               │
└──────────────┴──────────────────────────┴───────────────────────────────┘
                │                         │
                ▼                         ▼
        ┌───────────────┐         ┌───────────────┐
        │  React + Vite │  HTTPS  │ Express + JWT │
        │  (Frontend)   │ ──────► │  (Backend)    │
        └───────────────┘         └───────┬───────┘
                                          │
                                          ▼
                                  ┌───────────────┐
                                  │ MongoDB Atlas │
                                  └───────────────┘
```

*Figure 2 — Logical architecture: three roles, one SPA, one REST API, one database.*

### End-to-end lifecycle (simplified)

```text
 Profile ──► Find teammates ──► Collaboration feed ──► Request supervisor
                                                              │
                                                              ▼
                         Accept supervision ◄── Supervisor dashboard
                                                              │
                                                              ▼
              Project workspace ──► Milestones / tasks ──► Submissions
                                                              │
                                                              ▼
                                    Feedback / revision / approve
                                                              │
                                                              ▼
                                              Archive & department view
```

*Figure 3 — Capstone lifecycle as modeled in CapTrack.*

---

## User Roles & Modules

### 1. Student

| Module | What it does |
|--------|----------------|
| **My Profile** | Academic info (CGPA, credits, semester), skills, research interests, GitHub / LinkedIn / portfolio |
| **Find Teammates** | Search & filter peers by skills, interests, team status |
| **Supervisor Directory** | Browse faculty, expertise, **open supervision slots** |
| **Collaboration Feed** | Post “looking for members”; apply to supervisor recruitment posts |
| **Project Summary** | Group, supervisor, **submission-based progress**, milestones |
| **Project Workspace** | Tasks, milestones, submission history (unlocked when group is assigned) |
| **Submissions** | Upload / link deliverables (document, slides, code, report) |
| **Feedback** | Read supervisor comments and revision requests |
| **Activity Log** | Notifications (requests, reviews, system events) |
| **Settings** | Profile, notifications, privacy preferences |

### 2. Supervisor

| Module | What it does |
|--------|----------------|
| **Dashboard** | Assigned groups, pending submissions, milestone queue, feedback needed, **slot usage** |
| **Group formation view** | Progress = **members filled / target group size** (not task %) |
| **Supervision requests** | Accept / reject student requests |
| **Pending submissions** | Review → Approve or request revision with written feedback |
| **Milestone Tasks** | Group-wise task monitoring, feedback, approve |
| **Collaboration Feed** | Publish recruitment posts (topic, skills, team size) |
| **Student profiles** | Inspect candidate backgrounds |
| **Settings** | Capacity (`maxSupervisionSlots`), availability |

### 3. Administrator

| Module | What it does |
|--------|----------------|
| **Admin dashboard** | Department stats, charts, recent activity |
| **User management** | Activate / deactivate users, adjust supervision capacity |
| **Semester management** | Create, activate, archive academic semesters |
| **All projects** | Cross-group project list, export |
| **Submissions overview** | Department-wide submission health |

---

## Architecture

### Frontend

- **React 18 + TypeScript** SPA (Vite)
- Role-based routing via `App.tsx` + `Sidebar`
- Axios clients with `x-auth-token` header from `localStorage`
- UI: Tailwind-style utility classes, Lucide icons, Recharts, Sonner toasts

### Backend

- **Node.js + Express** REST API
- **Mongoose** models: `User`, `Project`, `Submission`, `SupervisionRequest`, `CollaborationPost`, `ActivityNotification`, `Semester`
- **JWT** auth middleware (`x-auth-token`)
- **bcryptjs** password hashing
- Role checks on supervisor / admin routes

### Data model (core relations)

```text
User (student | supervisor | admin)
  │
  ├── Project (student owner, groupName, supervisor name/ref, members, status)
  │     └── Submission[] (title, type, status, feedback, fileLink)
  │
  ├── SupervisionRequest (student → supervisor, status Pending|Accepted|Rejected)
  │
  ├── CollaborationPost (type supervisor|student, apply/join actions)
  │
  └── ActivityNotification (recipient, type, title, body)
```

*Figure 4 — Core entity relationships.*

### Auth flow

```text
Login (email + password)
    → bcrypt compare
    → JWT signed with JWT_SECRET (payload: user.id, role)
    → Frontend stores token in localStorage
    → Every API call sends header: x-auth-token: <jwt>
    → Middleware verifies token, loads user, checks isActive
```

---

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | React, TypeScript, Vite, Axios, Tailwind-oriented CSS, Lucide, Recharts, Sonner |
| **Backend** | Node.js, Express, Mongoose, jsonwebtoken, bcryptjs |
| **Database** | MongoDB Atlas (production), local MongoDB (optional dev) |
| **Deploy** | Render (static frontend + Node web service), `render.yaml` IaC |

---

## Repository Structure

```text
CapTrack/
├── backend/
│   ├── index.js                 # Express entry, CORS, route mount
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js              # JWT verify + isActive check
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Submission.js
│   │   ├── SupervisionRequest.js
│   │   ├── CollaborationPost.js
│   │   ├── ActivityNotification.js
│   │   └── Semester.js
│   ├── routes/
│   │   ├── auth.js              # register, login, /me
│   │   ├── projects.js          # dashboards, workspace, supervision
│   │   ├── submissions.js       # student / supervisor / admin flows
│   │   ├── profiles.js
│   │   ├── feed.js              # collaboration feed
│   │   ├── activity.js
│   │   └── admin.js
│   └── utils/                   # shared helpers (optional)
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # auth gate, role routing
│   │   ├── components/
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── SupervisorDashboard.tsx
│   │   │   ├── CollaborationFeed.tsx
│   │   │   ├── ProjectWorkspace.tsx
│   │   │   ├── MilestoneTasksPage.tsx
│   │   │   ├── ...
│   │   │   └── ui/LoginPage.tsx
│   │   └── ...
│   └── package.json
├── render.yaml                  # Render blueprint
└── README.md
```

---

## API Surface (High Level)

Base URL (prod): `https://captrack-backend.onrender.com/api`

| Area | Examples |
|------|----------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| **Projects** | `GET /projects/dashboard/student`, `GET /projects/dashboard/supervisor`, `GET /projects/workspace`, `POST /projects/request-supervision` |
| **Submissions** | `GET/POST /submissions/student`, `GET /submissions/supervisor`, `PATCH /submissions/supervisor/:id/review`, `GET /submissions/supervisor/dashboard` |
| **Feed** | `GET/POST /feed`, post actions (apply / join) |
| **Profiles** | `GET /profiles/overview`, supervisor directory endpoints |
| **Activity** | `GET /activity`, mark read / actions |
| **Admin** | dashboard, users, semesters, submissions |

> Protected routes require header:  
> `x-auth-token: <JWT>`

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- MongoDB Atlas URI (or local MongoDB)

### 1. Clone

```bash
git clone <your-repo-url>
cd CapTrack
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/captrack?retryWrites=true&w=majority
JWT_SECRET=use_a_long_random_string_here
NODE_ENV=development
```

```bash
npm run dev    # or: npm start
```

### 3. Frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

> If the app still hard-codes the Render URL in Axios instances, point those `baseURL` values to `import.meta.env.VITE_API_URL` (or your local API) during development.

```bash
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`).

### 4. First accounts

1. **Register** a student with `@std.ewubd.edu`  
2. **Register** a supervisor with `@ewubd.edu`  
3. Log in → JWT stored in `localStorage` as `token`  
4. Use role-specific dashboards  

---

## Environment Variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Strong secret for signing tokens (**do not use `secret` in production**) |
| `PORT` | No | Default `5000` |
| `NODE_ENV` | No | `development` / `production` |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Recommended | Backend origin, e.g. `https://captrack-backend.onrender.com` |

---

## Deployment (Render)

Configured via root `render.yaml` (Infrastructure-as-Code):

| Service | Type | Root | Build | Start / Publish |
|---------|------|------|-------|-----------------|
| **Backend** | Web service | `backend/` | `npm install` | `npm start` |
| **Frontend** | Static site | `frontend/` | `npm install && npm run build` | Publish `dist/` |

**Frontend SPA rewrite (required):**

- Source: `/*`  
- Destination: `/index.html`  
- Status: `200`  

**Production checklist**

- [ ] `JWT_SECRET` set to a strong unique value on the backend service  
- [ ] `MONGO_URI` points to Atlas  
- [ ] `VITE_API_URL` points to the live backend URL at **build time**  
- [ ] CORS allows the frontend origin  

---

## Team

**Group 5 — East West University, Department of CSE**

| Name | Student ID |
|------|------------|
| Wasimul Bari Rahat | 2022-3-60-243 |
| Md. Sabik Hossen | 2023-2-60-305 |
| Md Fahim Hassan Samir | 2023-3-60-239 |
| Nila Ashma Sara | 2022-2-60-104 |
| Nafiz Ibna Mahobub | 2022-3-60-126 |
| Samira Akter | 2022-3-60-301 |

**Submitted to:** Ahmed Adnan, Lecturer, Department of CSE, East West University  

---

## Academic Context

CapTrack was proposed as a **Capstone Project Lifecycle Management System** to:

- Increase **transparency** for departments (workloads, group status, progress)  
- Improve **team quality** via skill- and interest-based matching  
- Reduce reliance on informal networks  
- Build an **institutional archive** of projects, submissions, and feedback  
- Lower administrative overhead through automation  

The implemented MERN application realizes the proposal’s core modules: profiles, supervisor directory & slots, collaboration feed, project workspace, submissions, feedback, activity notifications, and admin tooling.

---

## License

Academic / course project for East West University CSE.  
All rights reserved by the authors unless otherwise stated by the department.

---

<p align="center">
  <strong>CapTrack</strong> · Group 5 · East West University<br/>
  <em>From team formation to final defense — in one platform.</em>
</p>
