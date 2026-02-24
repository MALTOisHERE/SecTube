import { chatService } from '../services/ai/index.js';
import { tools } from '../config/mcp.js';

/**
 * Chat with AI Assistant
 */
export const chatWithAI = async (req, res) => {
  const { messages } = req.body;

  // Check if chat service is available
  if (!chatService.isAvailable()) {
    return res.status(503).json({
      success: false,
      message: "AI chat is currently unavailable. Please ensure OPENROUTER_API_KEY is configured."
    });
  }

  // Extract user token from request (set by optionalAuth middleware)
  const userToken = req.headers.authorization?.replace('Bearer ', '');

  try {
    const result = await chatService.chat(messages, userToken, tools);
    res.json(result);
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to communicate with AI"
    });
  }
};
