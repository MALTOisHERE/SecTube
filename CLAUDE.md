# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CyberStream (SecTube) is a video streaming platform specifically designed for cybersecurity content, including bug bounties, ethical hacking tutorials, CTF writeups, and security research. The platform enables streamers to upload educational cybersecurity videos with automatic transcoding, while viewers can browse, search, and learn from categorized security content.

## Tech Stack

**Backend:** Node.js (ES modules), Express.js, MongoDB with Mongoose, JWT authentication, FFmpeg for video processing, Multer for file uploads

**Frontend:** React 18, Vite, TailwindCSS, Zustand (state management), React Query, Video.js player, React Router

## Development Commands

### Initial Setup
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# OR install individually
npm install              # Root workspace dependencies
cd backend && npm install
cd frontend && npm install
```

### Backend Environment Setup
Create `backend/.env` from `backend/.env.example` and configure:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Strong random string for JWT signing
- `FFMPEG_PATH` and `FFPROBE_PATH` - FFmpeg binary paths (OS-dependent)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `MAX_FILE_SIZE` - Video upload size limit (default: 5GB)

### Development
```bash
# Run both frontend and backend concurrently (from root)
npm run dev

# Run backend only (from backend/)
npm run dev

# Run frontend only (from frontend/)
npm run dev
```

Backend runs on port 5000 (configurable via PORT env var)
Frontend runs on port 5173 (Vite default)

### Production Build
```bash
# Build frontend
npm run build    # From root, or:
cd frontend && npm run build

# Start production server (serves both API and static frontend)
npm start    # From root, or:
cd backend && npm start
```

### Linting
```bash
# Frontend linting
cd frontend && npm run lint
```

### Testing
```bash
# Backend tests (not yet implemented)
cd backend && npm test

# Frontend tests (not yet implemented)
cd frontend && npm test
```

## Architecture

### Monorepo Structure
This is a workspace-based monorepo with three packages:
- Root: workspace manager with concurrently for dev scripts
- `backend/`: Express API server
- `frontend/`: React SPA

### Backend Architecture

**Entry Point:** `backend/src/server.js` sets up Express app, middleware, and routes

**Data Models** (`backend/src/models/`):
- `User.js` - User accounts with role-based access (viewer/streamer/admin). Streamers have additional fields: `channelName`, `specialties`, `socialLinks`, `subscribers`/`subscribedTo` arrays
- `Video.js` - Video metadata with cybersecurity-specific fields: `category`, `difficulty`, `toolsUsed`, `tags`. Stores `processedPaths` for multiple quality levels and `processingStatus` enum
- `Comment.js` - Video comments (referenced but not shown in initial exploration)

**Authentication Flow** (`backend/src/middleware/auth.js`):
- JWT-based authentication using `protect` middleware
- Token sent in Authorization header as `Bearer <token>`
- `authorize(...roles)` middleware for role-based route protection
- User model methods: `matchPassword()`, `getSignedJwtToken()`

**Video Processing Pipeline** (`backend/src/utils/videoProcessor.js`):
1. Video uploaded via Multer to `uploads/` directory
2. `processVideo()` function handles async processing:
   - Extracts metadata using ffprobe
   - Generates thumbnail at 10% timestamp (1280x720) if not custom uploaded
   - Transcodes to multiple qualities (360p, 480p, 720p, 1080p) based on source resolution
   - Uses libx264 codec with progressive streaming support (`-movflags +faststart`)
   - Deletes original upload after successful processing
   - Updates Video document with `processingStatus`: 'uploading' → 'processing' → 'ready'/'failed'

**Static File Serving:**
- `/videos` - Processed video files (multiple quality versions)
- `/thumbnails` - Video thumbnails
- `/avatars` - User avatar images

**API Routes** (`backend/src/routes/`):
- `/api/auth` - Registration, login, profile updates, streamer upgrade/downgrade
- `/api/videos` - Video CRUD, upload, search, like/dislike, comments
- `/api/users` - User profiles, subscribe/unsubscribe, user videos
- `/api/channels` - Channel listings, featured channels

### Frontend Architecture

**Entry Point:** `frontend/src/main.jsx` → `App.jsx` (React Router setup)

**State Management:**
- `frontend/src/store/authStore.js` - Zustand store with localStorage persistence for auth state (user, token, isAuthenticated)
- Authentication state synced with localStorage and injected into axios interceptors

**API Client** (`frontend/src/services/api.js`):
- Axios instance with base URL from `VITE_API_URL` env var
- Request interceptor adds JWT token from localStorage to Authorization header
- Organized API methods: `authAPI`, `videoAPI`, `userAPI`, `channelAPI`

**Routing:**
- Protected routes use `ProtectedRoute.jsx` component (checks `isAuthenticated` from Zustand store)
- Public pages: Home, Browse, Search, Login, Register, Video player, Channel
- Protected pages: Upload, Profile editing

**Key Components:**
- `VideoPlayer.jsx` - Video.js integration with adaptive quality support
- `VideoCard.jsx` - Reusable video thumbnail card
- `Navbar.jsx` - Navigation with auth state
- `ConfirmDialog.jsx` - Confirmation dialogs

### Cybersecurity-Specific Features

**Categories:**
Web Application Security, Network Security, Bug Bounty, Penetration Testing, Malware Analysis, Reverse Engineering, Mobile Security, Cloud Security, CTF Writeup, OSINT, Cryptography, IoT Security, Security Tools, Tutorial

**Difficulty Levels:** Beginner, Intermediate, Advanced, Expert

**Video Metadata:**
- `toolsUsed` - Array of tools/technologies (e.g., Burp Suite, Metasploit)
- `tags` - Searchable tags
- `specialties` - Streamer's areas of expertise

## Important Patterns and Conventions

### Code Style
- **Backend:** ES6+ modules (use `import`/`export`), async/await pattern, JSDoc comments recommended
- **Frontend:** Functional components with hooks, arrow functions for components
- **Commit messages:** Follow conventional commits (feat:, fix:, docs:, refactor:, test:, chore:)

### Error Handling
- Backend uses centralized error handler middleware in `backend/src/middleware/errorHandler.js`
- API responses follow format: `{ success: boolean, message: string, data?: any }`

### File Upload Flow
1. Frontend sends multipart/form-data with `Content-Type: multipart/form-data`
2. Backend Multer middleware (`backend/src/middleware/upload.js` and `avatarUpload.js`) handles file reception
3. For videos: upload → processing (async) → transcoding → cleanup
4. Video status tracked via `processingStatus` field in database

### Database Indexing
Video model has indexes on:
- `{ uploader: 1, uploadedAt: -1 }` - User's video timeline
- `{ category: 1, views: -1 }` - Category browsing with popularity
- `{ tags: 1 }` - Tag-based queries
- `{ title: 'text', description: 'text' }` - Full-text search

### Security Considerations
- Helmet middleware enabled with cross-origin resource policy for static files
- CORS configured for frontend URL
- Password hashing with bcryptjs (10 salt rounds)
- JWT expiration configurable (default: 7 days)
- File size limits enforced (default: 5GB)
- Input validation using express-validator
- Rate limiting with express-rate-limit

## Prerequisites

- Node.js v18+
- MongoDB v6+ (local or remote)
- FFmpeg installed and accessible in PATH (required for video processing)
  - Windows: Download from ffmpeg.org, add to PATH
  - macOS: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`

## Common Issues

### FFmpeg Not Found
If video processing fails with FFmpeg errors:
1. Verify FFmpeg installation: `ffmpeg -version`
2. Update `FFMPEG_PATH` and `FFPROBE_PATH` in `backend/.env` to absolute paths
3. On Windows, use forward slashes or escaped backslashes in paths

### MongoDB Connection
- Ensure MongoDB is running before starting backend
- Default connection: `mongodb://localhost:27017/cyber_stream_platform`
- Check connection status in backend startup logs

### CORS Issues
- Ensure `FRONTEND_URL` in `backend/.env` matches your frontend dev server URL
- Default is `http://localhost:5173`

### Video Upload Timeouts
- Large video files may timeout with default settings
- Increase `MAX_FILE_SIZE` in backend .env
- Check available disk space in `backend/uploads/` and `backend/videos/`

## Future Enhancements (Planned)

See README.md for full roadmap. Key planned features:
- Live streaming (RTMP/WebRTC)
- Real-time chat
- Redis caching
- Elasticsearch for advanced search
- Docker containerization
- CI/CD pipeline
- Automated testing (Jest, Cypress)
