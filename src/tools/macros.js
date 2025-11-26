import { z } from 'zod';
    import { zendeskClient } from '../zendesk-client.js';

    export const macrosTools = [
      {
        name: "list_macros",
        description: "List macros with pagination support. Returns first page only (default: up to 100 macros). WARNING: Returns very large datasets (~50k tokens). Always use pagination (page, per_page) or prefer get_macro if you have the macro ID.",
        schema: {
          page: z.number().int().optional().describe("Page number for pagination"),
          per_page: z.number().int().optional().describe("Number of macros per page (max 100)")
        },
        handler: async ({ page, per_page }) => {
          try {
            const params = { page, per_page };
            const result = await zendeskClient.listMacros(params);
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error listing macros: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "get_macro",
        description: "Get a specific macro by ID. PREFERRED over list_macros when you have the macro ID. Returns complete macro details. Use this instead of list_macros to avoid large dataset responses (~50k tokens).",
        schema: {
          id: z.number().int().describe("Macro ID")
        },
        handler: async ({ id }) => {
          try {
            const result = await zendeskClient.getMacro(id);
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error getting macro: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "create_macro",
        description: "Create a new macro in Zendesk. MODERATE RISK: This will create new data. Requires title and actions. Returns the created macro with its ID.",
        schema: {
          title: z.string().describe("Macro title"),
          description: z.string().optional().describe("Macro description"),
          actions: z.array(z.object({
            field: z.string().describe("Field to modify"),
            value: z.any().describe("Value to set")
          })).describe("Actions to perform when macro is applied")
        },
        handler: async ({ title, description, actions }) => {
          try {
            const macroData = {
              title,
              description,
              actions
            };
            
            const result = await zendeskClient.createMacro(macroData);
            return {
              content: [{ 
                type: "text", 
                text: `Macro created successfully!\n\n${JSON.stringify(result, null, 2)}`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error creating macro: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "update_macro",
        description: "Update an existing macro by ID. MODERATE RISK: This will modify existing data. Supports updating title, description, and actions. Returns the updated macro.",
        schema: {
          id: z.number().int().describe("Macro ID to update"),
          title: z.string().optional().describe("Updated macro title"),
          description: z.string().optional().describe("Updated macro description"),
          actions: z.array(z.object({
            field: z.string().describe("Field to modify"),
            value: z.any().describe("Value to set")
          })).optional().describe("Updated actions")
        },
        handler: async ({ id, title, description, actions }) => {
          try {
            const macroData = {};
            
            if (title !== undefined) macroData.title = title;
            if (description !== undefined) macroData.description = description;
            if (actions !== undefined) macroData.actions = actions;
            
            const result = await zendeskClient.updateMacro(id, macroData);
            return {
              content: [{ 
                type: "text", 
                text: `Macro updated successfully!\n\n${JSON.stringify(result, null, 2)}`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error updating macro: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "delete_macro",
        description: "Delete a macro by ID. HIGH RISK: This permanently deletes the macro and cannot be undone. Use with extreme caution.",
        schema: {
          id: z.number().int().describe("Macro ID to delete")
        },
        handler: async ({ id }) => {
          try {
            await zendeskClient.deleteMacro(id);
            return {
              content: [{ 
                type: "text", 
                text: `Macro ${id} deleted successfully!`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error deleting macro: ${error.message}` }],
              isError: true
            };
          }
        }
      }
    ];
