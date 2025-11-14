import { z } from 'zod';
import { zendeskClient } from '../zendesk-client.js';
import { ticketsTools } from './tickets.js';
import { usersTools } from './users.js';
import { organizationsTools } from './organizations.js';
import { groupsTools } from './groups.js';
import { macrosTools } from './macros.js';
import { viewsTools } from './views.js';
import { triggersTools } from './triggers.js';
import { automationsTools } from './automations.js';
import { searchTools } from './search.js';
import { helpCenterTools } from './help-center.js';
import { talkTools } from './talk.js';
import { chatTools } from './chat.js';

// Helper function to determine if a tool is risky (matches server.js logic)
function isRiskyTool(toolName) {
  const riskyPatterns = [
    /^create_/,
    /^update_/,
    /^delete_/
  ];
  return riskyPatterns.some(pattern => pattern.test(toolName));
}

function getToolRiskLevel(toolName) {
  if (toolName.startsWith('delete_')) return 'HIGH RISK';
  if (toolName.startsWith('create_') || toolName.startsWith('update_')) return 'MODERATE RISK';
  return 'SAFE';
}

// Helper to get all tools (excluding meta-tools)
function getAllToolsExcludingMeta() {
  return [
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
    // Only include support_info from supportTools, not the meta-tools
    { name: "support_info", description: "Get information about Zendesk Support configuration", schema: {}, handler: async () => ({ content: [{ type: "text", text: "Zendesk Support information would be displayed here. This is a placeholder for future implementation." }] }) },
    ...talkTools,
    ...chatTools
  ];
}

export const supportTools = [
  {
    name: "list_risky_tools",
    description: "List all risky tools that can modify or delete data in Zendesk. Use this to identify which tools require caution before use.",
    schema: {
      category: z.enum(["all", "high_risk", "moderate_risk"]).optional().describe("Filter by risk level: all (default), high_risk (delete operations), or moderate_risk (create/update operations)")
    },
    handler: async ({ category = "all" }) => {
      try {
        // Get all tools (excluding the meta-tools to avoid circular dependency)
        const allTools = getAllToolsExcludingMeta();

        // Categorize tools
        const riskyTools = allTools
          .filter(tool => isRiskyTool(tool.name))
          .map(tool => ({
            name: tool.name,
            description: tool.description,
            riskLevel: getToolRiskLevel(tool.name)
          }));

        const safeTools = allTools
          .filter(tool => !isRiskyTool(tool.name))
          .map(tool => ({
            name: tool.name,
            description: tool.description
          }));

        // Filter by category if specified
        let filteredRisky = riskyTools;
        if (category === "high_risk") {
          filteredRisky = riskyTools.filter(t => t.riskLevel === 'HIGH RISK');
        } else if (category === "moderate_risk") {
          filteredRisky = riskyTools.filter(t => t.riskLevel === 'MODERATE RISK');
        }

        let output = `⚠️ RISKY TOOLS - Modify or Delete Data\n\n`;
        output += `These tools can create, update, or delete data in Zendesk. Use with caution!\n\n`;
        output += `📊 Summary:\n`;
        output += `  ✅ Safe (Read-only) tools: ${safeTools.length}\n`;
        output += `  ⚠️ Risky (Modify/Delete) tools: ${riskyTools.length}\n`;
        output += `    - HIGH RISK (delete operations): ${riskyTools.filter(t => t.riskLevel === 'HIGH RISK').length}\n`;
        output += `    - MODERATE RISK (create/update operations): ${riskyTools.filter(t => t.riskLevel === 'MODERATE RISK').length}\n\n`;

        if (filteredRisky.length === 0) {
          output += `No risky tools found for category: ${category}\n`;
        } else {
          output += `=== ${category === "all" ? "ALL RISKY TOOLS" : category.toUpperCase().replace('_', ' ')} ===\n\n`;

          // Group by risk level
          const highRisk = filteredRisky.filter(t => t.riskLevel === 'HIGH RISK');
          const moderateRisk = filteredRisky.filter(t => t.riskLevel === 'MODERATE RISK');

          if (highRisk.length > 0) {
            output += `🔴 HIGH RISK (Delete Operations):\n`;
            highRisk.forEach(tool => {
              output += `  - ${tool.name}: ${tool.description}\n`;
            });
            output += `\n`;
          }

          if (moderateRisk.length > 0) {
            output += `🟡 MODERATE RISK (Create/Update Operations):\n`;
            moderateRisk.forEach(tool => {
              output += `  - ${tool.name}: ${tool.description}\n`;
            });
            output += `\n`;
          }
        }

        output += `\n💡 Tip: All tool descriptions are prefixed with risk indicators:\n`;
        output += `  ✅ SAFE (Read-only): for read-only operations\n`;
        output += `  ⚠️ MODERATE RISK: for create/update operations\n`;
        output += `  ⚠️ HIGH RISK: for delete operations\n`;

        return {
          content: [{
            type: "text",
            text: output
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error listing risky tools: ${error.message}` }],
          isError: true
        };
      }
    }
  },
  {
    name: "list_safe_tools",
    description: "List all safe (read-only) tools that only fetch, list, or read information without modifying data.",
    schema: {},
    handler: async () => {
      try {
        // Get all tools (excluding the meta-tools to avoid circular dependency)
        const allTools = getAllToolsExcludingMeta();

        // Get safe tools
        const safeTools = allTools
          .filter(tool => !isRiskyTool(tool.name))
          .map(tool => ({
            name: tool.name,
            description: tool.description
          }));

        let output = `✅ SAFE TOOLS - Read-Only Operations\n\n`;
        output += `These tools only fetch, list, or read information. They do not modify data.\n\n`;
        output += `Total safe tools: ${safeTools.length}\n\n`;
        output += `=== ALL SAFE TOOLS ===\n\n`;

        safeTools.forEach(tool => {
          output += `- ${tool.name}: ${tool.description}\n`;
        });

        output += `\n💡 Tip: All tool descriptions are prefixed with "✅ SAFE (Read-only):" to indicate they are safe to use.`;

        return {
          content: [{
            type: "text",
            text: output
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error listing safe tools: ${error.message}` }],
          isError: true
        };
      }
    }
  },
  {
    name: "support_info",
    description: "Get information about Zendesk Support configuration",
    schema: {},
    handler: async () => {
      try {
        // This would typically call an endpoint like /api/v2/account/settings
        // For now, we'll return a placeholder message
        return {
          content: [{
            type: "text",
            text: "Zendesk Support information would be displayed here. This is a placeholder for future implementation."
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error getting support info: ${error.message}` }],
          isError: true
        };
      }
    }
  }
];
