import { z } from 'zod';
    import { zendeskClient } from '../zendesk-client.js';

    export const usersTools = [
      {
        name: "list_users",
        description: "List users with pagination support. Returns first page only (default: up to 100 users). Use get_user if you have a specific user ID. Supports filtering by role (end-user, agent, admin). WARNING: May return large datasets - use pagination parameters (page, per_page) to limit results.",
        schema: {
          page: z.number().int().optional().describe("Page number for pagination"),
          per_page: z.number().int().optional().describe("Number of users per page (max 100)"),
          role: z.enum(["end-user", "agent", "admin"]).optional().describe("Filter users by role")
        },
        handler: async ({ page, per_page, role }) => {
          try {
            const params = { page, per_page, role };
            const result = await zendeskClient.listUsers(params);
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error listing users: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "get_user",
        description: "Get a specific user by ID. PREFERRED over list_users when you have the user ID. Returns complete user details including name, email, role, and organization.",
        schema: {
          id: z.number().int().describe("User ID")
        },
        handler: async ({ id }) => {
          try {
            const result = await zendeskClient.getUser(id);
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error getting user: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "create_user",
        description: "Create a new user in Zendesk. MODERATE RISK: This will create new data. Requires name and email. Returns the created user with its ID.",
        schema: {
          name: z.string().describe("User's full name"),
          email: z.string().email().describe("User's email address"),
          role: z.enum(["end-user", "agent", "admin"]).optional().describe("User's role"),
          phone: z.string().optional().describe("User's phone number"),
          organization_id: z.number().int().optional().describe("ID of the user's organization"),
          tags: z.array(z.string()).optional().describe("Tags for the user"),
          notes: z.string().optional().describe("Notes about the user")
        },
        handler: async ({ name, email, role, phone, organization_id, tags, notes }) => {
          try {
            const userData = {
              name,
              email,
              role,
              phone,
              organization_id,
              tags,
              notes
            };
            
            const result = await zendeskClient.createUser(userData);
            return {
              content: [{ 
                type: "text", 
                text: `User created successfully!\n\n${JSON.stringify(result, null, 2)}`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error creating user: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      {
        name: "update_user",
        description: "Update an existing user by ID. MODERATE RISK: This will modify existing data. Supports updating name, email, role, phone, organization, tags, and notes. Returns the updated user.",
        schema: {
          id: z.number().int().describe("User ID to update"),
          name: z.string().optional().describe("Updated user's name"),
          email: z.string().email().optional().describe("Updated email address"),
          role: z.enum(["end-user", "agent", "admin"]).optional().describe("Updated user's role"),
          phone: z.string().optional().describe("Updated phone number"),
          organization_id: z.number().int().optional().describe("Updated organization ID"),
          tags: z.array(z.string()).optional().describe("Updated tags for the user"),
          notes: z.string().optional().describe("Updated notes about the user")
        },
        handler: async ({ id, name, email, role, phone, organization_id, tags, notes }) => {
          try {
            const userData = {};
            
            if (name !== undefined) userData.name = name;
            if (email !== undefined) userData.email = email;
            if (role !== undefined) userData.role = role;
            if (phone !== undefined) userData.phone = phone;
            if (organization_id !== undefined) userData.organization_id = organization_id;
            if (tags !== undefined) userData.tags = tags;
            if (notes !== undefined) userData.notes = notes;
            
            const result = await zendeskClient.updateUser(id, userData);
            return {
              content: [{ 
                type: "text", 
                text: `User updated successfully!\n\n${JSON.stringify(result, null, 2)}`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error updating user: ${error.message}` }],
              isError: true
            };
          }
        }
      },
      // Note: delete_user tool commented out for security - could accidentally remove customer accounts
      // Uncomment below to re-enable delete functionality
      /*
      {
        name: "delete_user",
        description: "Delete a user",
        schema: {
          id: z.number().int().describe("User ID to delete")
        },
        handler: async ({ id }) => {
          try {
            await zendeskClient.deleteUser(id);
            return {
              content: [{ 
                type: "text", 
                text: `User ${id} deleted successfully!`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error deleting user: ${error.message}` }],
              isError: true
            };
          }
        }
      }
      */
    ];
