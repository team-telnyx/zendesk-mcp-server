import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { zendeskClient } from './zendesk-client.js';
import { ticketsTools } from './tools/tickets.js';
import { usersTools } from './tools/users.js';
import { organizationsTools } from './tools/organizations.js';
import { groupsTools } from './tools/groups.js';
import { macrosTools } from './tools/macros.js';
import { viewsTools } from './tools/views.js';
import { triggersTools } from './tools/triggers.js';
import { automationsTools } from './tools/automations.js';
import { searchTools } from './tools/search.js';
import { helpCenterTools } from './tools/help-center.js';
import { supportTools } from './tools/support.js';
import { talkTools } from './tools/talk.js';
import { chatTools } from './tools/chat.js';

// Helper function to determine if a tool is risky (modifies or deletes data)
function isRiskyTool(toolName) {
  const riskyPatterns = [
    /^create_/,
    /^update_/,
    /^delete_/
  ];
  return riskyPatterns.some(pattern => pattern.test(toolName));
}

// Helper function to get risk level and description
function getToolRiskInfo(toolName, description) {
  if (isRiskyTool(toolName)) {
    const riskType = toolName.startsWith('delete_') ? 'HIGH RISK' :
      toolName.startsWith('create_') ? 'MODERATE RISK' :
        'MODERATE RISK';
    return {
      isRisky: true,
      riskLevel: riskType,
      prefix: `⚠️ ${riskType}: `
    };
  }
  return {
    isRisky: false,
    riskLevel: 'SAFE',
    prefix: '✅ SAFE (Read-only): '
  };
}

// Factory function to create a new MCP server instance for each session
function createServer() {
  const server = new McpServer({
    name: "Zendesk API",
    version: "1.0.0",
    description: "MCP Server for interacting with the Zendesk API"
  });

  // Register all tools
  const allTools = [
    ...ticketsTools,
    ...usersTools,
    ...organizationsTools,
    ...groupsTools,
    ...macrosTools,
    ...viewsTools,
    ...triggersTools,
    ...automationsTools,
    ...searchTools,
    ...helpCenterTools,
    ...supportTools,
    ...talkTools,
    ...chatTools
  ];

  // Categorize tools for risk assessment
  const riskyTools = [];
  const safeTools = [];

  // Register each tool with the server and categorize
  allTools.forEach(tool => {
    const riskInfo = getToolRiskInfo(tool.name, tool.description);
    const enhancedDescription = `${riskInfo.prefix}${tool.description}`;

    // Categorize
    if (riskInfo.isRisky) {
      riskyTools.push({
        name: tool.name,
        description: tool.description,
        riskLevel: riskInfo.riskLevel
      });
    } else {
      safeTools.push({
        name: tool.name,
        description: tool.description
      });
    }

    // Register tool with Zod schema
    // The SDK automatically converts Zod schemas to JSON Schema using zodToJsonSchema,
    // which already adds additionalProperties: false by default (verified via testing)
    server.tool(
      tool.name,
      tool.schema,
      tool.handler,
      { description: enhancedDescription }
    );
  });

  // Store tool lists for resource access (closure)
  const toolLists = { riskyTools, safeTools, allTools };

  // Add a resource for Zendesk API documentation
  server.resource(
    "documentation",
    new ResourceTemplate("zendesk://docs/{section}", {
      list: async () => {
        return {
          resources: [
            { uri: "zendesk://docs/overview", name: "Zendesk API Overview", description: "Overview of the Zendesk API" },
            { uri: "zendesk://docs/tickets", name: "Tickets API", description: "Tickets API documentation" },
            { uri: "zendesk://docs/users", name: "Users API", description: "Users API documentation" },
            { uri: "zendesk://docs/organizations", name: "Organizations API", description: "Organizations API documentation" },
            { uri: "zendesk://docs/groups", name: "Groups API", description: "Groups API documentation" },
            { uri: "zendesk://docs/macros", name: "Macros API", description: "Macros API documentation" },
            { uri: "zendesk://docs/views", name: "Views API", description: "Views API documentation" },
            { uri: "zendesk://docs/triggers", name: "Triggers API", description: "Triggers API documentation" },
            { uri: "zendesk://docs/automations", name: "Automations API", description: "Automations API documentation" },
            { uri: "zendesk://docs/search", name: "Search API", description: "Search API documentation" },
            { uri: "zendesk://docs/help_center", name: "Help Center API", description: "Help Center API documentation" },
            { uri: "zendesk://docs/support", name: "Support API", description: "Support API documentation" },
            { uri: "zendesk://docs/talk", name: "Talk API", description: "Talk API documentation" },
            { uri: "zendesk://docs/chat", name: "Chat API", description: "Chat API documentation" }
          ]
        };
      }
    }),
    async (uri, { section }) => {
      const docs = {
        "tickets": "Tickets API allows you to create, modify, and manage support tickets.\nEndpoints: GET /api/v2/tickets, POST /api/v2/tickets, etc.",
        "users": "Users API allows you to create, modify, and manage end users and agents.\nEndpoints: GET /api/v2/users, POST /api/v2/users, etc.",
        "organizations": "Organizations API allows you to create and manage organizations.\nEndpoints: GET /api/v2/organizations, POST /api/v2/organizations, etc.",
        "groups": "Groups API allows you to create and manage agent groups.\nEndpoints: GET /api/v2/groups, POST /api/v2/groups, etc.",
        "macros": "Macros API allows you to create and manage macros for ticket actions.\nEndpoints: GET /api/v2/macros, POST /api/v2/macros, etc.",
        "views": "Views API allows you to create and manage views for filtering tickets.\nEndpoints: GET /api/v2/views, POST /api/v2/views, etc.",
        "triggers": "Triggers API allows you to create and manage triggers for automation.\nEndpoints: GET /api/v2/triggers, POST /api/v2/triggers, etc.",
        "automations": "Automations API allows you to create and manage time-based automations.\nEndpoints: GET /api/v2/automations, POST /api/v2/automations, etc.",
        "search": "Search API allows you to search across Zendesk data.\nEndpoints: GET /api/v2/search, etc.",
        "help_center": "Help Center API allows you to manage articles, categories, and sections.\nEndpoints: GET /api/v2/help_center/articles, etc.",
        "support": "Support API includes core functionality for the Support product.\nEndpoints: Various endpoints for tickets, users, etc.",
        "talk": "Talk API allows you to manage Zendesk Talk phone calls and settings.\nEndpoints: GET /api/v2/channels/voice/stats, etc.",
        "chat": "Chat API allows you to manage Zendesk Chat conversations.\nEndpoints: GET /api/v2/chats, etc.",
        "overview": "The Zendesk API is a RESTful API that uses JSON for serialization. It provides access to Zendesk Support, Talk, Chat, and Guide products."
      };

      if (!section || section === "all") {
        return {
          contents: [{
            uri: uri.href,
            text: `Zendesk API Documentation Overview\n\n${Object.keys(docs).map(key => `- ${key}: ${docs[key].split('\n')[0]}`).join('\n')}`
          }]
        };
      }

      if (docs[section]) {
        return {
          contents: [{
            uri: uri.href,
            text: `Zendesk API Documentation: ${section}\n\n${docs[section]}`
          }]
        };
      }

      return {
        contents: [{
          uri: uri.href,
          text: `Documentation section '${section}' not found. Available sections: ${Object.keys(docs).join(', ')}`
        }]
      };
    }
  );

  // Add a resource for tool safety information
  server.resource(
    "tool_safety",
    new ResourceTemplate("zendesk://tools/{category}", {
      list: async () => {
        return {
          resources: [
            { uri: "zendesk://tools/summary", name: "Tool Safety Summary", description: "Summary of safe vs risky tools" },
            { uri: "zendesk://tools/risky", name: "Risky Tools", description: "List of all risky tools that modify or delete data" },
            { uri: "zendesk://tools/safe", name: "Safe Tools", description: "List of all safe read-only tools" },
            { uri: "zendesk://tools/all", name: "All Risky Tools", description: "All risky tools (same as risky)" }
          ]
        };
      }
    }),
    async (uri, { category }) => {
      if (category === "risky" || category === "all") {
        const riskyList = toolLists.riskyTools.map(t =>
          `- ${t.name} (${t.riskLevel}): ${t.description}`
        ).join('\n');

        return {
          contents: [{
            uri: uri.href,
            text: `⚠️ RISKY TOOLS - Modify or Delete Data\n\nThese tools can create, update, or delete data in Zendesk. Use with caution!\n\n${riskyList}\n\nTotal risky tools: ${toolLists.riskyTools.length}`
          }]
        };
      }

      if (category === "safe") {
        const safeList = toolLists.safeTools.map(t =>
          `- ${t.name}: ${t.description}`
        ).join('\n');

        return {
          contents: [{
            uri: uri.href,
            text: `✅ SAFE TOOLS - Read-Only Operations\n\nThese tools only fetch, list, or read information. They do not modify data.\n\n${safeList}\n\nTotal safe tools: ${toolLists.safeTools.length}`
          }]
        };
      }

      if (category === "summary") {
        return {
          contents: [{
            uri: uri.href,
            text: `📊 TOOL SAFETY SUMMARY\n\n✅ Safe (Read-only) tools: ${toolLists.safeTools.length}\n⚠️ Risky (Modify/Delete) tools: ${toolLists.riskyTools.length}\n📦 Total tools: ${toolLists.allTools.length}\n\nUse zendesk://tools/risky to see all risky tools\nUse zendesk://tools/safe to see all safe tools`
          }]
        };
      }

      return {
        contents: [{
          uri: uri.href,
          text: `Available categories: risky, safe, summary, all`
        }]
      };
    }
  );

  return server;
}

export { createServer };
