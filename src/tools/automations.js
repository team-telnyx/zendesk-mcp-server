import { z } from 'zod';
    import { zendeskClient } from '../zendesk-client.js';

    export const automationsTools = [
      {
        name: "list_automations",
        description: "List automations in Zendesk",
        schema: {
          page: z.number().optional().describe("Page number for pagination"),
          per_page: z.number().optional().describe("Number of automations per page (max 100)")
        },
        handler: async ({ page, per_page }) => {
          try {
            const params = { page, per_page };
            const result = await zendeskClient.listAutomations(params);
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error listing automations: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "get_automation",
        description: "Get a specific automation by ID",
        schema: {
          id: z.number().describe("Automation ID")
        },
        handler: async ({ id }) => {
          try {
            const result = await zendeskClient.getAutomation(id);
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error getting automation: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "create_automation",
        description: "Create a new automation",
        schema: {
          title: z.string().describe("Automation title"),
          description: z.string().optional().describe("Automation description"),
          conditions: z.object({
            all: z.array(z.object({
              field: z.string().describe("Field to check"),
              operator: z.string().describe("Operator for comparison"),
              value: z.any().describe("Value to compare against")
            })).optional(),
            any: z.array(z.object({
              field: z.string().describe("Field to check"),
              operator: z.string().describe("Operator for comparison"),
              value: z.any().describe("Value to compare against")
            })).optional()
          }).describe("Conditions for the automation"),
          actions: z.array(z.object({
            field: z.string().describe("Field to modify"),
            value: z.any().describe("Value to set")
          })).describe("Actions to perform when automation conditions are met")
        },
        handler: async ({ title, description, conditions, actions }) => {
          try {
            const automationData = {
              title,
              description,
              conditions,
              actions
            };
            
            const result = await zendeskClient.createAutomation(automationData);
            return {
              content: [{ 
                type: "text", 
                text: `Automation created successfully!\n\n${JSON.stringify(result, null, 2)}`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error creating automation: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "update_automation",
        description: "Update an existing automation",
        schema: {
          id: z.number().describe("Automation ID to update"),
          title: z.string().optional().describe("Updated automation title"),
          description: z.string().optional().describe("Updated automation description"),
          conditions: z.object({
            all: z.array(z.object({
              field: z.string().describe("Field to check"),
              operator: z.string().describe("Operator for comparison"),
              value: z.any().describe("Value to compare against")
            })).optional(),
            any: z.array(z.object({
              field: z.string().describe("Field to check"),
              operator: z.string().describe("Operator for comparison"),
              value: z.any().describe("Value to compare against")
            })).optional()
          }).optional().describe("Updated conditions"),
          actions: z.array(z.object({
            field: z.string().describe("Field to modify"),
            value: z.any().describe("Value to set")
          })).optional().describe("Updated actions")
        },
        handler: async ({ id, title, description, conditions, actions }) => {
          try {
            const automationData = {};
            
            if (title !== undefined) automationData.title = title;
            if (description !== undefined) automationData.description = description;
            if (conditions !== undefined) automationData.conditions = conditions;
            if (actions !== undefined) automationData.actions = actions;
            
            const result = await zendeskClient.updateAutomation(id, automationData);
            return {
              content: [{ 
                type: "text", 
                text: `Automation updated successfully!\n\n${JSON.stringify(result, null, 2)}`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error updating automation: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      // Note: delete_automation tool commented out for security - automations are critical for support workflow
      // Uncomment below to re-enable delete functionality
      /*
      {
        name: "delete_automation",
        description: "Delete an automation",
        schema: {
          id: z.number().describe("Automation ID to delete")
        },
        handler: async ({ id }) => {
          try {
            await zendeskClient.deleteAutomation(id);
            return {
              content: [{ 
                type: "text", 
                text: `Automation ${id} deleted successfully!`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error deleting automation: ${error.message}` }],
              isError: true
            };
          }
        }
      }
      */
    ];
