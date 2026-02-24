/**
 * Chat Service
 * Handles conversational AI interactions with users
 */

import OpenAI from "openai";
import { toolExecutor } from './tools/toolExecutor.js';
import { sanitizeData } from './utils/sanitizer.js';

// System prompt for the AI assistant
const SYSTEM_MESSAGE = `You are the SecTube AI assistant. You help users find videos, manage their accounts, and learn about cybersecurity. You have access to the SecTube API through MCP (Model Context Protocol) tools.

TOOL USAGE:
- Tools are automatically generated from the SecTube API (Swagger specs)
- Tool naming: {method}_{path} (e.g., get_videos, patch_auth_profile)
- You inherit the logged-in user's permissions and JWT token
- Always use appropriate filters when fetching data (limit, category, sort)
- Batch related actions when possible to reduce API calls
- See MCP_DOCUMENTATION.md for complete tool reference

RESPONSE GUIDELINES:
- Do NOT use emojis in your responses
- Provide clear, contextual explanations (not raw JSON)
- Use markdown formatting for better readability
- Keep responses professional and security-focused

SECURITY & PRIVACY:
- NEVER display or mention: passwords, JWT tokens, API keys, reset tokens, 2FA secrets
- Sensitive fields are auto-filtered, but never attempt to access them
- Respect user authorization levels (viewer, streamer, admin)
- Handle errors gracefully and explain them in user-friendly terms

COMMON TASKS:
- Profile info: get_auth_me
- Update profile: patch_auth_profile (bio, displayName, socialLinks, specialties)
- Find videos: get_videos (with filters: search, category, difficulty, limit, sort)
- Like video: post_videos_id_like
- Subscribe: post_users_id_subscribe
- Saved videos: get_users_me_saved
- Watch history: get_users_me_history

For detailed tool documentation, refer to: backend/src/config/MCP_DOCUMENTATION.md`;

// Validate required environment variables
if (!process.env.OPENROUTER_API_KEY) {
  console.warn("⚠️ OPENROUTER_API_KEY is not set. Chat functionality will be disabled.");
}

// Initialize OpenAI client with OpenRouter configuration
const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.BACKEND_URL || "http://localhost:5000",
    "X-Title": "SecTube AI",
  }
}) : null;

/**
 * Format MCP tools into OpenAI-compatible tool definitions
 */
const getOpenAITools = (tools) => {
  return tools.map(tool => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  }));
};

/**
 * Chat with AI using OpenRouter
 */
export const chatService = {
  /**
   * Process a chat message and get AI response
   * @param {Array} messages - Chat history
   * @param {String} userToken - User's JWT token for authenticated API calls
   * @param {Array} availableTools - MCP tools available to the AI
   * @returns {Object} AI response and updated message history
   */
  async chat(messages, userToken, availableTools) {
    if (!openai) {
      throw new Error("AI chat is currently unavailable. Please ensure OPENROUTER_API_KEY is configured.");
    }

    try {
      // 1. Initial request to LLM with tools
      const response = await openai.chat.completions.create({
        model: process.env.CHAT_MODEL || "anthropic/claude-3.5-sonnet",
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          ...messages
        ],
        tools: getOpenAITools(availableTools),
        tool_choice: "auto",
      });

      let responseMessage = response.choices[0].message;

      // 2. Check if the LLM wants to call tools
      if (responseMessage.tool_calls) {
        const toolCalls = responseMessage.tool_calls;
        const updatedMessages = [...messages, responseMessage];

        // Execute all tool calls with user's token
        for (const toolCall of toolCalls) {
          const result = await toolExecutor.execute(toolCall, userToken, availableTools);
          updatedMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: result,
          });
        }

        // 3. Get final response from LLM after tool results
        const finalResponse = await openai.chat.completions.create({
          model: process.env.CHAT_MODEL || "anthropic/claude-3.5-sonnet",
          messages: [
            { role: "system", content: SYSTEM_MESSAGE },
            ...updatedMessages
          ],
        });

        return {
          message: finalResponse.choices[0].message,
          history: updatedMessages
        };
      }

      // If no tools were called, return simple response
      return { message: responseMessage };

    } catch (error) {
      console.error("AI Chat Error:", error);
      throw new Error(error.response?.data?.error?.message || error.message || "Failed to communicate with AI");
    }
  },

  /**
   * Check if chat service is available
   */
  isAvailable() {
    return !!openai;
  }
};
