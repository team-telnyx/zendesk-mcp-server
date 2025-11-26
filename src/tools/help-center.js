import { z } from 'zod';
    import { zendeskClient } from '../zendesk-client.js';

    export const helpCenterTools = [
      {
        name: "list_articles",
        description: "List Help Center articles with pagination support. Returns first page only (default: up to 100 articles). Use get_article if you have the article ID. Supports sorting via sort_by and sort_order. WARNING: May return large datasets - use pagination parameters (page, per_page) to limit results.",
        schema: {
          page: z.number().int().optional().describe("Page number for pagination"),
          per_page: z.number().int().optional().describe("Number of articles per page (max 100)"),
          sort_by: z.string().optional().describe("Field to sort by"),
          sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order (asc or desc)")
        },
        handler: async ({ page, per_page, sort_by, sort_order }) => {
          try {
            const params = { page, per_page, sort_by, sort_order };
            const result = await zendeskClient.listArticles(params);
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error listing articles: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "get_article",
        description: "Get a specific Help Center article by ID. PREFERRED over list_articles when you have the article ID. Returns complete article details including title, body, and metadata.",
        schema: {
          id: z.number().int().describe("Article ID")
        },
        handler: async ({ id }) => {
          try {
            const result = await zendeskClient.getArticle(id);
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error getting article: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "create_article",
        description: "Create a new Help Center article in Zendesk. MODERATE RISK: This will create new data. Requires title, body, and section_id. Returns the created article with its ID.",
        schema: {
          title: z.string().describe("Article title"),
          body: z.string().describe("Article body content (HTML)"),
          section_id: z.number().int().describe("Section ID where the article will be created"),
          locale: z.string().optional().describe("Article locale (e.g., 'en-us')"),
          draft: z.boolean().optional().describe("Whether the article is a draft"),
          permission_group_id: z.number().int().optional().describe("Permission group ID for the article"),
          user_segment_id: z.number().int().optional().describe("User segment ID for the article"),
          label_names: z.array(z.string()).optional().describe("Labels for the article")
        },
        handler: async ({ title, body, section_id, locale, draft, permission_group_id, user_segment_id, label_names }) => {
          try {
            const articleData = {
              title,
              body,
              locale,
              draft,
              permission_group_id,
              user_segment_id,
              label_names
            };
            
            const result = await zendeskClient.createArticle(articleData, section_id);
            return {
              content: [{ 
                type: "text", 
                text: `Article created successfully!\n\n${JSON.stringify(result, null, 2)}`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error creating article: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "update_article",
        description: "Update an existing Help Center article by ID. MODERATE RISK: This will modify existing data. Supports updating title, body, locale, draft status, permissions, and labels. Returns the updated article.",
        schema: {
          id: z.number().int().describe("Article ID to update"),
          title: z.string().optional().describe("Updated article title"),
          body: z.string().optional().describe("Updated article body content (HTML)"),
          locale: z.string().optional().describe("Updated article locale (e.g., 'en-us')"),
          draft: z.boolean().optional().describe("Whether the article is a draft"),
          permission_group_id: z.number().int().optional().describe("Updated permission group ID"),
          user_segment_id: z.number().int().optional().describe("Updated user segment ID"),
          label_names: z.array(z.string()).optional().describe("Updated labels")
        },
        handler: async ({ id, title, body, locale, draft, permission_group_id, user_segment_id, label_names }) => {
          try {
            const articleData = {};
            
            if (title !== undefined) articleData.title = title;
            if (body !== undefined) articleData.body = body;
            if (locale !== undefined) articleData.locale = locale;
            if (draft !== undefined) articleData.draft = draft;
            if (permission_group_id !== undefined) articleData.permission_group_id = permission_group_id;
            if (user_segment_id !== undefined) articleData.user_segment_id = user_segment_id;
            if (label_names !== undefined) articleData.label_names = label_names;
            
            const result = await zendeskClient.updateArticle(id, articleData);
            return {
              content: [{ 
                type: "text", 
                text: `Article updated successfully!\n\n${JSON.stringify(result, null, 2)}`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error updating article: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "delete_article",
        description: "Delete a Help Center article by ID. HIGH RISK: This permanently deletes the article and cannot be undone. Use with extreme caution.",
        schema: {
          id: z.number().int().describe("Article ID to delete")
        },
        handler: async ({ id }) => {
          try {
            await zendeskClient.deleteArticle(id);
            return {
              content: [{ 
                type: "text", 
                text: `Article ${id} deleted successfully!`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error deleting article: ${error.message}` }],
              isError: true
            };
          }
        }
      }
    ];
