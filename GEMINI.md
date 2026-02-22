# SecTube (CyberStream) Project Context

SecTube is a modern, cybersecurity-focused video streaming platform designed for sharing educational content such as bug bounty tutorials, ethical hacking research, and CTF writeups. It employs a MERN-like stack with specialized video processing capabilities.

## 🏗️ Architecture & Tech Stack

The project is structured as a workspace-based monorepo:

### Backend (Node.js/Express)
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT-based with role-based access control (Viewer, Streamer, Admin)
- **Video Processing:** FFmpeg (via `fluent-ffmpeg`) for local transcoding or Cloudinary integration for cloud-based processing
- **Security:** Helmet, CORS, Rate-limiting, and Bcryptjs for password hashing

### Frontend (React/Vite)
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **State Management:** Zustand (with localStorage persistence for auth)
- **Data Fetching:** React Query (TanStack Query)
- **Video Playback:** Video.js for adaptive quality streaming
- **Routing:** React Router v6

## 🚀 Key Commands

### Initial Setup
```bash
npm run install:all    # Installs root, backend, and frontend dependencies
```

### Development
```bash
npm run dev            # Starts both backend and frontend concurrently from the root
cd backend && npm run dev    # Starts backend only (Port 5000)
cd frontend && npm run dev   # Starts frontend only (Port 5173)
```

### Production
```bash
npm run build          # Builds the frontend for production
npm start              # Starts the production server (serves API and static frontend)
```

### Quality & Testing
```bash
cd frontend && npm run lint  # Runs ESLint for the frontend
cd backend && npm test        # Placeholder for backend tests
```

## 📁 Project Structure Highlights

- `backend/src/server.js`: API entry point and middleware configuration.
- `backend/src/models/`: Mongoose schemas (User, Video, Comment).
- `backend/src/utils/videoProcessor.js`: Core logic for FFmpeg transcoding and thumbnail generation.
- `frontend/src/App.jsx`: Main routing and layout wrapper.
- `frontend/src/store/`: Zustand stores for global state (auth, UI).
- `frontend/src/services/api.js`: Axios instance and API service definitions.

## 🛠️ Development Conventions

### Coding Style
- **Backend:** Functional approach using `async/await`. ES6 modules are mandatory. Use centralized error handling via `middleware/errorHandler.js`.
- **Frontend:** Functional components with React Hooks. Prefer TailwindCSS for all styling needs.
- **Commits:** Follow Conventional Commits (e.g., `feat:`, `fix:`, `docs:`).

### Video Processing Workflow
Videos undergo a status-based lifecycle: `uploading` → `processing` → `ready` (or `failed`). Transcoding generates multiple qualities (360p to 1080p) to support adaptive streaming.

### Security & Authentication
- Protected routes on the frontend use the `ProtectedRoute` component.
- Backend routes are protected using the `protect` and `authorize` middlewares.
- Always check for `isAuthenticated` and user roles when implementing features.

## 📝 Environment Setup
Ensure `.env` files are configured in the `backend/` directory (refer to `.env.example`). Critical variables include `MONGODB_URI`, `JWT_SECRET`, and `FFMPEG_PATH`.
