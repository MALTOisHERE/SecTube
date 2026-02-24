import OpenAI from "openai";
import { tools } from "../config/mcp.js";
import axios from "axios";

/**
 * Sanitize data to remove sensitive fields before sending to AI
 */
const sanitizeData = (data) => {
  if (!data) return data;

  // Sensitive fields that should never be exposed
  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'resetPasswordToken',
    'resetPasswordExpire',
    'twoFactorSecret',
    'apiKey',
    'secret',
    'privateKey',
    'accessToken',
    'refreshToken'
  ];

  // Recursively remove sensitive fields
  const sanitize = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized = { ...obj };

      for (const field of sensitiveFields) {
        if (sanitized[field] !== undefined) {
          delete sanitized[field];
        }
      }

      // Recursively sanitize nested objects
      for (const key in sanitized) {
        if (sanitized[key] && typeof sanitized[key] === 'object') {
          sanitized[key] = sanitize(sanitized[key]);
        }
      }

      return sanitized;
    }

    return obj;
  };

  return sanitize(data);
};

// System prompt for the AI assistant
const SYSTEM_MESSAGE = `You are the SecTube AI assistant. You help users find videos, manage their accounts, and learn about cybersecurity. You have access to the SecTube API tools to retrieve video information, user data, and perform actions on behalf of users.

IMPORTANT GUIDELINES:
- Do NOT use emojis in your responses
- NEVER display or mention sensitive information including: passwords, JWT tokens, API keys, reset tokens, or any authentication credentials
- When showing user information, redact or skip any sensitive fields
- Keep responses professional, clean, and security-focused
- If asked for sensitive information, politely decline and explain why it cannot be shown`;

// Validate required environment variables
if (!process.env.OPENROUTER_API_KEY) {
  console.warn("⚠️ OPENROUTER_API_KEY is not set. Chat functionality will be disabled.");
}

if (!process.env.BACKEND_URL) {
  console.warn("⚠️ BACKEND_URL is not set. Using default: http://localhost:5000");
}

// Initialize OpenAI client with OpenRouter configuration
const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.BACKEND_URL || "http://localhost:5000", // Optional, for OpenRouter rankings
    "X-Title": "SecTube AI", // Optional
  }
}) : null;

/**
 * Formats MCP tools into OpenAI-compatible tool definitions
 */
const getOpenAITools = () => {
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
 * Executes a tool call from the LLM
 */
const executeTool = async (toolCall, userToken) => {
  const tool = tools.find(t => t.name === toolCall.function.name);
  if (!tool) return `Tool ${toolCall.function.name} not found`;

  const { path, method } = tool._metadata;

  // Parse arguments safely
  let args = {};
  try {
    if (typeof toolCall.function.arguments === 'string') {
      args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
    } else if (typeof toolCall.function.arguments === 'object') {
      args = toolCall.function.arguments || {};
    }
  } catch (error) {
    console.error('Error parsing tool arguments:', error);
    return `Error parsing arguments: ${error.message}`;
  }

  const API_BASE_URL = process.env.BACKEND_URL || "http://localhost:5000";

  let url = `${API_BASE_URL}${path}`;

  // Replace path parameters
  Object.keys(args).forEach((key) => {
    if (url.includes(`{${key}}`)) {
      url = url.replace(`{${key}}`, encodeURIComponent(args[key]));
      delete args[key];
    }
  });

  try {
    const headers = { "Content-Type": "application/json" };

    // Add user's JWT token if available
    if (userToken) {
      headers.Authorization = `Bearer ${userToken}`;
    }

    const response = await axios({
      method,
      url,
      params: method === "get" ? args : {},
      data: method !== "get" ? args : {},
      headers,
    });

    // Filter out sensitive information before returning to AI
    const sanitizedData = sanitizeData(response.data);
    return JSON.stringify(sanitizedData);
  } catch (error) {
    return `Error executing tool: ${error.response?.data?.message || error.message}`;
  }
};

export const chatWithAI = async (req, res) => {
  const { messages } = req.body;

  if (!openai) {
    return res.status(503).json({
      success: false,
      message: "AI chat is currently unavailable. Please ensure OPENROUTER_API_KEY is configured."
    });
  }

  // Extract user token from request (set by optionalAuth middleware)
  const userToken = req.headers.authorization?.replace('Bearer ', '');

  try {
    // 1. Initial request to LLM with tools
    const response = await openai.chat.completions.create({
      model: process.env.CHAT_MODEL || "anthropic/claude-3.5-sonnet",
      messages: [
        { role: "system", content: SYSTEM_MESSAGE },
        ...messages
      ],
      tools: getOpenAITools(),
      tool_choice: "auto",
    });

    let responseMessage = response.choices[0].message;

    // 2. Check if the LLM wants to call tools
    if (responseMessage.tool_calls) {
      const toolCalls = responseMessage.tool_calls;

      // Add assistant message with tool calls to history
      const updatedMessages = [...messages, responseMessage];

      // Execute all tool calls with user's token
      for (const toolCall of toolCalls) {
        const result = await executeTool(toolCall, userToken);
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

      return res.json({
        message: finalResponse.choices[0].message,
        history: updatedMessages
      });
    }

    // If no tools were called, return simple response
    res.json({ message: responseMessage });

  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || error.message || "Failed to communicate with AI"
    });
  }
};
