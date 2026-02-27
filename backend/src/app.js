import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middleware/errorHandler.js';
import passport from './config/passport.js';
import { setupSwagger } from './config/swagger.js';
import { mcpServer } from './config/mcp.js';
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import videoRoutes from './routes/videos.js';
import channelRoutes from './routes/channels.js';
import chatRoutes from './routes/chat.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Trust proxy (required for rate limiting behind Render/Vercel)
app.set('trust proxy', 1);

// Passport middleware
app.use(passport.initialize());

// CORS - must be first
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Serve static files BEFORE helmet (to avoid CSP issues)
app.use('/videos', express.static(path.join(__dirname, '../videos')));
app.use('/thumbnails', express.static(path.join(__dirname, '../thumbnails')));
app.use('/avatars', express.static(path.join(__dirname, '../avatars')));

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
})); // Security headers with static file support
app.use(morgan('dev')); // Logging
app.use(compression()); // Compress responses

// MCP SSE Endpoint
let mcpTransport;
app.get("/api/mcp", async (req, res) => {
  console.log("🤖 AI Agent initiating MCP SSE connection...");
  try {
    mcpTransport = new SSEServerTransport("/api/mcp/messages", res);
    await mcpServer.connect(mcpTransport);

    // Handle close
    req.on('close', () => {
      console.log("🔌 MCP connection closed");
      mcpTransport = null;
    });
  } catch (error) {
    console.error("❌ MCP Connection Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/mcp/messages", async (req, res) => {
  if (!mcpTransport) {
    console.warn("⚠️ POST to /api/mcp/messages but no active transport");
    return res.status(400).send("No active MCP transport");
  }

  try {
    await mcpTransport.handlePostMessage(req, res);
  } catch (error) {
    console.error("❌ MCP Message Error:", error);
    res.status(500).send(error.message);
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger (development only)
if (process.env.NODE_ENV !== 'production') {
  setupSwagger(app);
} else {
  // Provide helpful message in production
  app.get('/api-docs', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'API documentation is only available in development mode',
      hint: 'Visit the health endpoint at /api/health to check API status'
    });
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SecTube API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
