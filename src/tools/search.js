import { z } from 'zod';
import { zendeskClient } from '../zendesk-client.js';

export const searchTools = [
  {
    name: "search",
    description: "Search across Zendesk data (tickets, users, organizations, etc.) with pagination support. Returns first page only (default: up to 100 results). Use specific get_* tools if you know the resource type and ID. Supports sorting and pagination parameters.",
    schema: {
      query: z.string().describe("Search query string"),
      sort_by: z.string().optional().describe("Field to sort by"),
      sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order (asc or desc)"),
      page: z.number().int().optional().describe("Page number for pagination"),
      per_page: z.number().int().optional().describe("Number of results per page (max 100)")
    },
    handler: async ({ query, sort_by, sort_order, page, per_page }) => {
      try {
        const params = { sort_by, sort_order, page, per_page };
        const result = await zendeskClient.search(query, params);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error searching: ${error.message}` }],
          isError: true
        };
      }
    }
  }
];
