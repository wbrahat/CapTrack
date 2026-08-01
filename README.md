# 🚀 CapTrack - Capstone Project Tracking & Management System

CapTrack is a comprehensive MERN-based web application designed to streamline the lifecycle of university capstone projects. It manages supervision workflows, milestone submissions, user roles, and centralized administration through an intuitive and modern interface.

## 🌐 Live Demo
- **Frontend App:** https://captrack-frontend.onrender.com/
- **Backend API:** https://captrack-backend.onrender.com/

## ✨ Key Features
- **Secure Authentication:** JWT-based secure authentication with encrypted passwords via `bcryptjs`.
- **Role-Based Access Control (RBAC):** Dedicated dashboards and permissions for **Students**, **Supervisors**, and **Admins**.
- **Supervision Request Workflow:** Interactive Request/Accept lifecycle between students and available faculty members.
- **Project Tracking:** Real-time updates on project lifecycles, milestones, and active progress tracking.
- **Submission & Feedback Hub:** Specialized endpoints for handling student milestone submissions and supervisor feedback.
- **Admin Command Center:** Management tools for system users, semester setups, and overall project submission oversight.
- **Dynamic Activity Feed:** Social-style activity tracking and profile feeds for project-centric news and notifications.
- **Persistent Cloud Database:** Fully integrated with MongoDB Atlas for secure, fault-tolerant data storage.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Axios, Material UI (MUI), Radix UI, Tailwind CSS
- **Backend:** Node.js, Express, Mongoose, JSON Web Tokens (JWT)
- **Database:** MongoDB Atlas (Cloud Storage with local MongoDB fallback compatibility)
- **Deployment:** Render (Automated Monorepo Architecture via Infrastructure-as-Code Blueprint)

## 📁 Repository Structure
```text
repo-root/
  ├── backend/       # Express.js REST API Server code & routes
  ├── frontend/      # React.js SPA Application (Vite Build)
  ├── render.yaml    # Render Infrastructure Deployment Blueprint
  └── README.md      # Project Documentation & Guides
```

## ⚙️ Local Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com
cd CapTrack
```

### 2. Backend Environment & Setup
Navigate to the server directory, install components, and launch the service:
```bash
cd backend
npm install
```
Create a `.env` file inside the `backend/` folder and populate it with your environment profiles:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/captrack?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
```
Run the production or development gateway engine:
```bash
# Start standard server
npm start

# Run with nodemon development reload
npm run dev
```

### 3. Frontend Environment & Setup
Navigate to the client app interface, install node components, and launch the Vite bundler:
```bash
cd ../frontend
npm install
```
Create a `.env` file inside the `frontend/` folder to target the local backend port:
```env
VITE_API_URL=http://localhost:5000
```
Run the local Vite development instance server:
```bash
npm run dev
```

---

## ☁️ Deployment Specifications (Render Infrastructure Blueprint)

The deployment configuration is standardized in the root `render.yaml` using Render's Infrastructure-as-Code (IaC) layer. It automatically partitions the repository into separate synchronized services:

### 📦 Node.js Backend Service
- **Service Type:** Web Service (`type: web`)
- **Root Directory:** `backend`
- **Build Target Command:** `npm install`
- **Application Startup Call:** `npm start`
- **Required Env Variables:** `MONGO_URI` (Atlas Conn String), `NODE_ENV=production`

### 🎨 React Static Site Frontend Service
- **Service Type:** Static Site (`type: static_site`)
- **Root Directory:** `frontend`
- **Build Target Command:** `npm install && npm run build`
- **Static Public Folder Path:** `dist` (Vite Default Compilation Target Directory)
- **Required Env Variables:** `VITE_API_URL` (Points dynamically to the Live Backend URL)
- **Single Page Application (SPA) Client Routing Rule:**
  To guarantee that client-side page refreshes (e.g., `/dashboard`, `/login`) do not encounter a native `404 Not Found` error, the following URL rewrite rule is globally enforced via the blueprint:
  - **Source Link Pattern:** `/*`
  - **Internal Destination Route:** `/index.html`
  - **HTTP Delivery Status Code:** `200`
