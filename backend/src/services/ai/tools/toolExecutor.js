/**
 * Tool Executor
 * Executes AI tool calls against the SecTube API
 */

import axios from "axios";
import { sanitizeData } from '../utils/sanitizer.js';

/**
 * Execute a tool call from the LLM
 */
export const toolExecutor = {
  async execute(toolCall, userToken, availableTools) {
    const tool = availableTools.find(t => t.name === toolCall.function.name);
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
  }
};
