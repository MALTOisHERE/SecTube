# SecTube - Cybersecurity Streaming Platform

A modern video streaming platform designed specifically for cybersecurity enthusiasts, bug hunters, ethical hackers, and security researchers to share knowledge and learn together.

## 🚀 Quick Start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for free deployment guide using Vercel, Render, and MongoDB Atlas.

## Features

### For Viewers
- Browse and search thousands of cybersecurity videos
- Filter by category (Bug Bounty, Web Security, Penetration Testing, etc.)
- Filter by difficulty level (Beginner to Expert)
- Subscribe to your favorite security researchers
- Personalized subscription feed with the latest content
- Watch History to track your learning journey
- Saved Videos for quick access to important tutorials
- Like, comment, and engage with the community
- Personalized recommendations

### For Streamers
- Upload and manage video content
- Automatic video processing and transcoding (multiple qualities)
- Channel customization with bio and social links
- Track views and engagement metrics
- Organize content by categories and tags
- Specify tools used and difficulty levels

### Security & Platform Features
- **Two-Factor Authentication (2FA)**: TOTP-based protection (Google Authenticator, Authy).
- **Silent Signup Protocol**: Advanced protection against user enumeration during registration.
- **Email Verification**: Mandatory verification flow for account activation.
- **Secure Password Recovery**: Robust, rate-limited email-driven reset flow.
- **Anti-Enumeration Login**: Standardized generic error responses for all auth failures.
- User authentication with JWT
- SSO Integration with **GitHub** and **Google**
- Role-based access control (Viewer, Streamer, Admin)
- Modern Cyber UI with animated backgrounds and high-tech aesthetic
- Video on Demand (VOD) with adaptive quality
- Automatic thumbnail generation
- Real-time video processing with FFmpeg
- Responsive design with dark mode
- RESTful API architecture

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Passport.js** for GitHub/Google SSO
- **FFmpeg** for video processing
- **Multer** for file uploads
- **bcryptjs** for password hashing
- **speakeasy & qrcode** for TOTP 2FA
- **nodemailer** for secure email delivery
- **express-rate-limit** for brute-force protection

### Frontend
- **React 18** with Hooks
- **React Router** for navigation
- **Vite** for fast development
- **TailwindCSS** for styling
- **Zustand** for state management
- **React Query** for data fetching
- **Video.js** for video playback
- **Axios** for HTTP requests

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher)
- **FFmpeg** (for video processing)
- **npm** or **yarn**

### Installing FFmpeg

#### Windows
1. Download FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to your PATH environment variable

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd malto_stream_pltfrm
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 3. Set up environment variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/cyber_stream_platform

# JWT Secret (Generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# File Upload
MAX_FILE_SIZE=5368709120
UPLOAD_PATH=./uploads
VIDEO_PATH=./videos
THUMBNAIL_PATH=./thumbnails

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# FFmpeg paths (adjust if needed)
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

# Video Quality Settings
VIDEO_QUALITIES=360p,480p,720p,1080p
```

### 4. Start MongoDB

Make sure MongoDB is running:
```bash
# Windows (if installed as service)
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
mongod
```

### 5. Run the application

#### Development mode (recommended)
Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

#### Production mode
```bash
# Build frontend
cd frontend
npm run build

# Start backend (serves both API and frontend)
cd ../backend
npm start
```

## 🔑 SSO Configuration Guide

To enable GitHub and Google login, you must register OAuth applications on their respective platforms.

### 1. GitHub SSO Setup
1.  Go to [GitHub Developer Settings](https://github.com/settings/developers).
2.  Click **New OAuth App**.
3.  **Homepage URL**: `http://localhost:5173`
4.  **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
5.  Generate a **Client Secret** and copy both the ID and Secret to your `.env`.

### 2. Google SSO Setup
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project and navigate to **APIs & Services > Credentials**.
3.  Click **Create Credentials > OAuth client ID** (Select *Web application*).
4.  **Authorized JavaScript origins**: `http://localhost:5173`
5.  **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callback`
6.  Copy the **Client ID** and **Client Secret** to your `.env`.

## API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

#### Verify Email
```http
GET /api/auth/verify-email/:token
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Verify 2FA Login
```http
POST /api/auth/verify-login-2fa
Content-Type: application/json

{
  "userId": "user_id_here",
  "token": "123456"
}
```

#### Password Recovery
```http
POST /api/auth/forgotpassword
Content-Type: application/json
{ "email": "john@example.com" }

PUT /api/auth/resetpassword/:token
Content-Type: application/json
{ "password": "newpassword123" }
```

#### Security Management
```http
POST /api/auth/setup-2fa
POST /api/auth/verify-2fa
POST /api/auth/disable-2fa
PUT /api/auth/updatepassword
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Upgrade to Streamer
```http
POST /api/auth/upgrade-to-streamer
Authorization: Bearer <token>
Content-Type: application/json

{
  "channelName": "My Security Channel",
  "specialties": ["Bug Bounty", "Web Application Security"]
}
```

### Video Endpoints

#### Get Videos
```http
GET /api/videos?page=1&limit=12&category=Bug%20Bounty&sort=popular
```

#### Get Single Video
```http
GET /api/videos/:videoId
```

#### Upload Video (Streamers only)
```http
POST /api/videos/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "video": <file>,
  "thumbnail": <file>,
  "title": "SQL Injection Tutorial",
  "description": "Learn SQL injection...",
  "category": "Web Application Security",
  "difficulty": "Beginner",
  "tags": "sql,web,tutorial",
  "toolsUsed": "Burp Suite,sqlmap"
}
```

#### Search Videos
```http
GET /api/videos/search?q=sql%20injection&category=Web%20Application%20Security
```

### User Endpoints

#### Get User Profile
```http
GET /api/users/:username
```

#### Subscribe to User
```http
POST /api/users/:userId/subscribe
Authorization: Bearer <token>
```

### Channel Endpoints

#### Get All Channels
```http
GET /api/channels?page=1&limit=12
```

#### Get Featured Channels
```http
GET /api/channels/featured?limit=6
```

## Project Structure

```
malto_stream_pltfrm/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── auth.js              # Authentication logic
│   │   │   ├── users.js             # User management
│   │   │   ├── videos.js            # Video operations
│   │   │   └── channels.js          # Channel management
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authentication
│   │   │   ├── errorHandler.js      # Error handling
│   │   │   └── upload.js            # File upload handling
│   │   ├── models/
│   │   │   ├── User.js              # User schema
│   │   │   ├── Video.js             # Video schema
│   │   │   └── Comment.js           # Comment schema
│   │   ├── routes/
│   │   │   ├── auth.js              # Auth routes
│   │   │   ├── users.js             # User routes
│   │   │   ├── videos.js            # Video routes
│   │   │   └── channels.js          # Channel routes
│   │   ├── utils/
│   │   │   └── videoProcessor.js    # FFmpeg video processing
│   │   └── server.js                # Express app entry point
│   ├── uploads/                      # Temporary upload directory
│   ├── videos/                       # Processed video files
│   ├── thumbnails/                   # Video thumbnails
│   ├── .env.example                  # Environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Navigation bar
│   │   │   ├── VideoCard.jsx        # Video thumbnail card
│   │   │   ├── VideoPlayer.jsx      # Video.js player
│   │   │   └── ProtectedRoute.jsx   # Route guard
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Home page
│   │   │   ├── Browse.jsx           # Browse videos
│   │   │   ├── Search.jsx           # Search page
│   │   │   ├── Video.jsx            # Video player page
│   │   │   ├── Channel.jsx          # Channel page
│   │   │   ├── Upload.jsx           # Video upload
│   │   │   ├── Profile.jsx          # User profile
│   │   │   ├── Login.jsx            # Login page
│   │   │   └── Register.jsx         # Registration
│   │   ├── services/
│   │   │   └── api.js               # API client
│   │   ├── store/
│   │   │   └── authStore.js         # Auth state management
│   │   ├── App.jsx                   # Main app component
│   │   ├── main.jsx                  # React entry point
│   │   └── index.css                 # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

## Categories

The platform supports the following cybersecurity categories:
- Web Application Security
- Network Security
- Bug Bounty
- Penetration Testing
- Malware Analysis
- Reverse Engineering
- Mobile Security
- Cloud Security
- CTF Writeup
- OSINT
- Cryptography
- IoT Security
- Security Tools
- Tutorial

## Difficulty Levels
- Beginner
- Intermediate
- Advanced
- Expert

## 🌐 Deployment

For detailed deployment instructions for free hosting, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**

### Quick Deployment Summary

**Free Tier Options:**
- **Frontend**: Vercel (recommended) or Netlify
- **Backend**: Render or Railway
- **Database**: MongoDB Atlas (512MB free)
- **File Storage**: Cloudinary (25GB free)

See the full deployment guide for step-by-step instructions.

## Future Enhancements

### Planned Features
- Live streaming support (RTMP/WebRTC)
- Real-time chat during live streams
- Playlists and collections
- Advanced analytics dashboard
- Email notifications
- Video recommendations algorithm
- Multi-language support
- Mobile apps (React Native)
- CDN integration for global delivery
- Advanced search with filters
- User achievements and badges
- Private messaging between users

### Infrastructure Improvements
- Redis caching for better performance
- Elasticsearch for advanced search
- AWS S3/Cloudflare for video storage
- WebSocket for real-time features
- Docker containerization
- CI/CD pipeline
- Automated testing (Jest, Cypress)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security Considerations

This platform is designed for **educational purposes** and **authorized security research**. When using this platform:

- Only upload content related to ethical hacking and authorized security testing
- Respect responsible disclosure practices
- Do not share exploits for active vulnerabilities without proper coordination
- Follow all applicable laws and regulations
- Obtain proper authorization before conducting security testing

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## Acknowledgments

- Built with modern web technologies
- Inspired by the cybersecurity community
- Special thanks to all contributors and security researchers

---

**Happy Learning and Stay Secure!** 🔐
