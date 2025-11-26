import { z } from 'zod';
    import { zendeskClient } from '../zendesk-client.js';

    export const organizationsTools = [
      {
        name: "list_organizations",
        description: "List organizations with pagination support. Returns first page only (default: up to 100 organizations). Use get_organization if you have the organization ID. WARNING: May return large datasets (~17k tokens) - use pagination parameters (page, per_page) to limit results.",
        schema: {
          page: z.number().int().optional().describe("Page number for pagination"),
          per_page: z.number().int().optional().describe("Number of organizations per page (max 100)")
        },
        handler: async ({ page, per_page }) => {
          try {
            const params = { page, per_page };
            const result = await zendeskClient.listOrganizations(params);
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error listing organizations: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "get_organization",
        description: "Get a specific organization by ID. PREFERRED over list_organizations when you have the organization ID. Returns complete organization details. Use this instead of list_organizations to avoid large dataset responses.",
        schema: {
          id: z.number().int().describe("Organization ID")
        },
        handler: async ({ id }) => {
          try {
            const result = await zendeskClient.getOrganization(id);
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error getting organization: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "create_organization",
        description: "Create a new organization in Zendesk. MODERATE RISK: This will create new data. Requires name. Returns the created organization with its ID.",
        schema: {
          name: z.string().describe("Organization name"),
          domain_names: z.array(z.string()).optional().describe("Domain names for the organization"),
          details: z.string().optional().describe("Details about the organization"),
          notes: z.string().optional().describe("Notes about the organization"),
          tags: z.array(z.string()).optional().describe("Tags for the organization")
        },
        handler: async ({ name, domain_names, details, notes, tags }) => {
          try {
            const orgData = {
              name,
              domain_names,
              details,
              notes,
              tags
            };
            
            const result = await zendeskClient.createOrganization(orgData);
            return {
              content: [{ 
                type: "text", 
                text: `Organization created successfully!\n\n${JSON.stringify(result, null, 2)}`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error creating organization: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "update_organization",
        description: "Update an existing organization by ID. MODERATE RISK: This will modify existing data. Supports updating name, domain_names, details, notes, and tags. Returns the updated organization.",
        schema: {
          id: z.number().int().describe("Organization ID to update"),
          name: z.string().optional().describe("Updated organization name"),
          domain_names: z.array(z.string()).optional().describe("Updated domain names"),
          details: z.string().optional().describe("Updated details"),
          notes: z.string().optional().describe("Updated notes"),
          tags: z.array(z.string()).optional().describe("Updated tags")
        },
        handler: async ({ id, name, domain_names, details, notes, tags }) => {
          try {
            const orgData = {};
            
            if (name !== undefined) orgData.name = name;
            if (domain_names !== undefined) orgData.domain_names = domain_names;
            if (details !== undefined) orgData.details = details;
            if (notes !== undefined) orgData.notes = notes;
            if (tags !== undefined) orgData.tags = tags;
            
            const result = await zendeskClient.updateOrganization(id, orgData);
            return {
              content: [{ 
                type: "text", 
                text: `Organization updated successfully!\n\n${JSON.stringify(result, null, 2)}`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error updating organization: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      // Note: delete_organization tool commented out for security - could remove customer organizations
      // Uncomment below to re-enable delete functionality
      /*
      {
        name: "delete_organization",
        description: "Delete an organization",
        schema: {
          id: z.number().describe("Organization ID to delete")
        },
        handler: async ({ id }) => {
          try {
            await zendeskClient.deleteOrganization(id);
            return {
              content: [{ 
                type: "text", 
                text: `Organization ${id} deleted successfully!`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error deleting organization: ${error.message}` }],
              isError: true
            };
          }
        }
      }
      */
    ];
