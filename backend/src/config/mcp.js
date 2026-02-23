import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import specs from "./swagger.js";
import axios from "axios";

console.log("🛠️ Initializing MCP with Swagger specs...");
if (!specs || !specs.paths) {
  console.warn("⚠️ No Swagger paths found in specs!");
}

/**
 * Shared MCP Server logic for SecTube
 */
export const mcpServer = new Server(
  {
    name: "sectube-api-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const getToolName = (path, method) => {
  const cleanPath = path
    .replace(/\/api\//, "")
    .replace(/\//g, "_")
    .replace(/[{}]/g, "");
  return `${method}_${cleanPath}`;
};

export const tools = [];
const API_BASE_URL = process.env.API_URL || "http://localhost:5000";

// Populate tools from Swagger specs
if (specs && specs.paths) {
  Object.entries(specs.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, detail]) => {
      if (!["get", "post", "put", "delete"].includes(method)) return;

      tools.push({
        name: getToolName(path, method),
        description: detail.summary || detail.description || `Execute ${method} on ${path}`,
        inputSchema: {
          type: "object",
          properties: {
            ...(detail.parameters || [])
              .filter((p) => p.in === "path")
              .reduce((acc, p) => {
                acc[p.name] = { type: "string", description: p.description };
                return acc;
              }, {}),
            ...(detail.parameters || [])
              .filter((p) => p.in === "query")
              .reduce((acc, p) => {
                acc[p.name] = { type: "string", description: p.description };
                return acc;
              }, {}),
            ...(detail.requestBody?.content?.["application/json"]?.schema?.properties || {}),
          },
          required: [
            ...(detail.parameters || [])
              .filter((p) => p.in === "path" && p.required)
              .map((p) => p.name),
          ],
        },
        _metadata: { path, method },
      });
    });
  });
}

// Handler to list available tools
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(({ _metadata, ...tool }) => tool),
  };
});

// Handler to execute a tool
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find((t) => t.name === request.params.name);
  if (!tool) throw new Error(`Tool not found: ${request.params.name}`);

  const { path, method } = tool._metadata;
  let url = `${API_BASE_URL}${path}`;
  const args = request.params.arguments || {};

  Object.keys(args).forEach((key) => {
    if (url.includes(`{${key}}`)) {
      url = url.replace(`{${key}}`, encodeURIComponent(args[key]));
      delete args[key];
    }
  });

  try {
    const response = await axios({
      method,
      url,
      params: method === "get" ? args : {},
      data: method !== "get" ? args : {},
      headers: { "Content-Type": "application/json" },
    });

    return {
      content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.response?.data?.message || error.message}` }],
      isError: true,
    };
  }
});
