import { z } from 'zod';
import { zendeskClient } from '../zendesk-client.js';

export const ticketsTools = [
  {
    name: "list_tickets",
    description: "List tickets with pagination support. Returns first page only (default: up to 100 tickets). Use get_ticket if you have a specific ticket ID. Supports filtering via sort_by and sort_order. WARNING: May return large datasets - use pagination parameters (page, per_page) to limit results.",
    schema: {
      page: z.number().int().optional().describe("Page number for pagination"),
      per_page: z.number().int().optional().describe("Number of tickets per page (max 100)"),
      sort_by: z.string().optional().describe("Field to sort by"),
      sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order (asc or desc)")
    },
    handler: async ({ page, per_page, sort_by, sort_order }) => {
      try {
        const params = { page, per_page, sort_by, sort_order };
        const result = await zendeskClient.listTickets(params);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error listing tickets: ${error.message}` }],
          isError: true
        };
      }
    }
  },
  {
    name: "get_ticket",
    description: "Get a specific ticket by ID with human-readable names for requester, assignee, and group. PREFERRED over list_tickets when you have the ticket ID. Returns complete ticket details including formatted output with names.",
    schema: {
      id: z.number().int().describe("Ticket ID"),
      include_names: z.boolean().optional().describe("Fetch and include names for requester, assignee, and group (default: true)")
    },
    handler: async ({ id, include_names = true }) => {
      try {
        const result = await zendeskClient.getTicket(id);
        const ticket = result.ticket || result;

        // Fetch names for requester, assignee, and group if requested
        const nameInfo = {
          requester: null,
          assignee: null,
          group: null
        };

        if (include_names) {
          // Fetch requester name
          if (ticket.requester_id) {
            try {
              const requesterResult = await zendeskClient.getUser(ticket.requester_id);
              const requester = requesterResult.user || requesterResult;
              nameInfo.requester = {
                name: requester.name || 'Unknown',
                email: requester.email || 'Unknown',
                role: requester.role || 'unknown'
              };
            } catch (error) {
              // If fetch fails, we'll just show the ID
              nameInfo.requester = null;
            }
          }

          // Fetch assignee name
          if (ticket.assignee_id) {
            try {
              const assigneeResult = await zendeskClient.getUser(ticket.assignee_id);
              const assignee = assigneeResult.user || assigneeResult;
              nameInfo.assignee = {
                name: assignee.name || 'Unknown',
                email: assignee.email || 'Unknown',
                role: assignee.role || 'unknown'
              };
            } catch (error) {
              // If fetch fails, we'll just show the ID
              nameInfo.assignee = null;
            }
          }

          // Fetch group name
          if (ticket.group_id) {
            try {
              const groupResult = await zendeskClient.getGroup(ticket.group_id);
              const group = groupResult.group || groupResult;
              nameInfo.group = {
                name: group.name || 'Unknown'
              };
            } catch (error) {
              // If fetch fails, we'll just show the ID
              nameInfo.group = null;
            }
          }
        }

        // Format output with names
        let formattedOutput = `=== TICKET ${id} ===\n\n`;
        formattedOutput += `Subject: ${ticket.subject || 'N/A'}\n`;
        formattedOutput += `Status: ${ticket.status || 'N/A'}\n`;
        formattedOutput += `Priority: ${ticket.priority || 'N/A'}\n`;
        formattedOutput += `Type: ${ticket.type || 'N/A'}\n`;
        formattedOutput += `Created: ${ticket.created_at || 'N/A'}\n`;
        formattedOutput += `Updated: ${ticket.updated_at || 'N/A'}\n\n`;

        // Requester with name
        if (ticket.requester_id) {
          if (nameInfo.requester) {
            formattedOutput += `Requester: ${nameInfo.requester.name} (${nameInfo.requester.email}) | Role: ${nameInfo.requester.role} | ID: ${ticket.requester_id}\n`;
          } else {
            formattedOutput += `Requester ID: ${ticket.requester_id}\n`;
          }
        }

        // Assignee with name
        if (ticket.assignee_id) {
          if (nameInfo.assignee) {
            formattedOutput += `Assignee: ${nameInfo.assignee.name} (${nameInfo.assignee.email}) | Role: ${nameInfo.assignee.role} | ID: ${ticket.assignee_id}\n`;
          } else {
            formattedOutput += `Assignee ID: ${ticket.assignee_id}\n`;
          }
        } else {
          formattedOutput += `Assignee: Unassigned\n`;
        }

        // Group with name
        if (ticket.group_id) {
          if (nameInfo.group) {
            formattedOutput += `Group: ${nameInfo.group.name} | ID: ${ticket.group_id}\n`;
          } else {
            formattedOutput += `Group ID: ${ticket.group_id}\n`;
          }
        }

        // Organization if present
        if (ticket.organization_id) {
          formattedOutput += `Organization ID: ${ticket.organization_id}\n`;
        }

        // Tags
        if (ticket.tags && ticket.tags.length > 0) {
          formattedOutput += `Tags: ${ticket.tags.join(', ')}\n`;
        }

        // Description
        if (ticket.description) {
          formattedOutput += `\n=== DESCRIPTION ===\n${ticket.description}\n`;
        }

        formattedOutput += `\n\n=== RAW JSON ===\n${JSON.stringify(result, null, 2)}`;

        return {
          content: [{
            type: "text",
            text: formattedOutput
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error getting ticket: ${error.message}` }],
          isError: true
        };
      }
    }
  },
  {
    name: "list_ticket_comments",
    description: "List comments for a specific ticket with pagination. Returns first page only (default: up to 100 comments). Each comment shows public/private status. Use summarize_ticket_comments if you need all comments analyzed. Use count_ticket_comments first to determine pagination needs.",
    schema: {
      id: z.number().int().describe("Ticket ID"),
      page: z.number().int().optional().describe("Page number for pagination"),
      per_page: z.number().int().optional().describe("Number of comments per page (max 100)"),
      sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order (asc or desc)")
    },
    handler: async ({ id, page, per_page, sort_order }) => {
      try {
        const params = {};
        if (page !== undefined) params.page = page;
        if (per_page !== undefined) params.per_page = per_page;
        if (sort_order !== undefined) params.sort_order = sort_order;

        const result = await zendeskClient.listTicketComments(id, params);

        // Format output to make public/private status very obvious
        const comments = result.comments || [];
        let formattedOutput = `=== TICKET ${id} COMMENTS ===\n\n`;
        formattedOutput += `Total comments in this page: ${comments.length}\n`;

        // Count public vs private
        const publicCount = comments.filter(c => c.public === true).length;
        const privateCount = comments.filter(c => c.public === false).length;
        formattedOutput += `Public: ${publicCount} | Private: ${privateCount}\n\n`;

        // Format each comment with clear public/private indicator
        comments.forEach((comment, index) => {
          const visibility = comment.public === true ? '🔓 PUBLIC' : '🔒 PRIVATE';
          formattedOutput += `\n--- Comment ${index + 1} [${visibility}] ---\n`;
          formattedOutput += `ID: ${comment.id}\n`;
          formattedOutput += `Public: ${comment.public}\n`;
          formattedOutput += `Author ID: ${comment.author_id}\n`;
          formattedOutput += `Created: ${comment.created_at}\n`;
          formattedOutput += `Body:\n${comment.body}\n`;
          if (comment.attachments && comment.attachments.length > 0) {
            formattedOutput += `\n=== ATTACHMENTS (${comment.attachments.length}) ===\n`;
            comment.attachments.forEach((att, idx) => {
              const fileName = att.file_name || att.filename || 'Unknown';
              const contentType = att.content_type || 'Unknown';
              const contentUrl = att.content_url || att.url || null;
              formattedOutput += `${idx + 1}. ${fileName} (${contentType})`;
              if (contentUrl) {
                formattedOutput += `\n   🔗 URL: ${contentUrl}`;
              }
              formattedOutput += `\n`;
            });
          }
        });

        // Add pagination info if available
        if (result.next_page) {
          formattedOutput += `\n\n⚠️  More comments available. Use page=${(page || 1) + 1} to fetch next page.\n`;
        }

        // Also include raw JSON for programmatic access
        formattedOutput += `\n\n=== RAW JSON ===\n${JSON.stringify(result, null, 2)}`;

        return {
          content: [{
            type: "text",
            text: formattedOutput
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error listing ticket comments: ${error.message}` }],
          isError: true
        };
      }
    }
  },
  {
    name: "count_ticket_comments",
    description: "Get the count of comments for a specific ticket. Use this to determine pagination needs before calling list_ticket_comments. Returns total count without fetching all comment data.",
    schema: {
      id: z.number().int().describe("Ticket ID")
    },
    handler: async ({ id }) => {
      try {
        const result = await zendeskClient.countTicketComments(id);
        const count = result.count?.value || result.count || 0;
        let formattedOutput = `=== TICKET ${id} COMMENT COUNT ===\n\n`;
        formattedOutput += `Total comments: ${count}\n`;
        formattedOutput += `\nTo fetch all comments, use list_ticket_comments with per_page parameter.\n`;
        formattedOutput += `Example: per_page=10 means you'll need ${Math.ceil(count / 10)} pages.\n`;
        formattedOutput += `\n=== RAW JSON ===\n${JSON.stringify(result, null, 2)}`;

        return {
          content: [{
            type: "text",
            text: formattedOutput
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error counting ticket comments: ${error.message}` }],
          isError: true
        };
      }
    }
  },
  {
    name: "summarize_ticket_comments",
    description: "Get a comprehensive summary of all ticket comments. Automatically fetches all pages and provides analyzed output with public/private breakdown and customer vs agent identification. PREFERRED over list_ticket_comments when you need complete comment analysis rather than browsing individual comments.",
    schema: {
      id: z.number().int().describe("Ticket ID"),
      max_comments: z.number().int().optional().describe("Maximum number of comments to fetch (default: 1000)"),
      include_author_info: z.boolean().optional().describe("Fetch author role information to identify customer vs agent comments (default: true)")
    },
    handler: async ({ id, max_comments = 1000, include_author_info = true }) => {
      try {
        // First get the count
        const countResult = await zendeskClient.countTicketComments(id);
        const totalCount = countResult.count?.value || countResult.count || 0;

        // Fetch all comments in batches
        const allComments = [];
        const perPage = 100;
        const maxPages = Math.min(Math.ceil(totalCount / perPage), Math.ceil(max_comments / perPage));

        for (let page = 1; page <= maxPages; page++) {
          const result = await zendeskClient.listTicketComments(id, {
            per_page: perPage,
            page: page
          });
          const comments = result.comments || [];
          allComments.push(...comments);
          if (comments.length < perPage) break; // No more comments
        }

        // Analyze comments
        const publicComments = allComments.filter(c => c.public === true);
        const privateComments = allComments.filter(c => c.public === false);

        // Fetch author information to identify customer vs agent
        const authorInfo = new Map();
        const customerComments = [];
        const agentComments = [];

        if (include_author_info) {
          // Get unique author IDs
          const authorIds = [...new Set(allComments.map(c => c.author_id))];

          // Fetch user info for each author (with error handling)
          for (const authorId of authorIds) {
            try {
              const userResult = await zendeskClient.getUser(authorId);
              const user = userResult.user || userResult;
              authorInfo.set(authorId, {
                name: user.name || 'Unknown',
                email: user.email || 'Unknown',
                role: user.role || 'unknown',
                isAgent: user.role === 'agent' || user.role === 'admin',
                isCustomer: user.role === 'end-user'
              });
            } catch (error) {
              // If user fetch fails, mark as unknown
              authorInfo.set(authorId, {
                name: 'Unknown',
                email: 'Unknown',
                role: 'unknown',
                isAgent: false,
                isCustomer: false
              });
            }
          }

          // Categorize comments
          allComments.forEach(comment => {
            const info = authorInfo.get(comment.author_id);
            if (info?.isCustomer) {
              customerComments.push(comment);
            } else if (info?.isAgent) {
              agentComments.push(comment);
            }
          });
        }

        let summary = `=== TICKET ${id} COMMENT SUMMARY ===\n\n`;
        summary += `Total comments fetched: ${allComments.length} of ${totalCount}\n`;
        summary += `🔓 Public comments: ${publicComments.length}\n`;
        summary += `🔒 Private comments: ${privateComments.length}\n`;

        if (include_author_info) {
          summary += `👤 Customer comments: ${customerComments.length}\n`;
          summary += `👨‍💼 Agent comments: ${agentComments.length}\n`;
        }
        summary += `\n`;

        // List all comments with clear indicators
        summary += `=== ALL COMMENTS ===\n\n`;
        allComments.forEach((comment, index) => {
          const visibility = comment.public === true ? '🔓 PUBLIC' : '🔒 PRIVATE';
          let authorLabel = `Author ID: ${comment.author_id}`;

          if (include_author_info) {
            const info = authorInfo.get(comment.author_id);
            if (info) {
              const authorType = info.isCustomer ? '👤 CUSTOMER' : info.isAgent ? '👨‍💼 AGENT' : '❓ UNKNOWN';
              authorLabel = `${authorType} | ${info.name} (${info.email}) | Role: ${info.role}`;
            }
          }

          summary += `${index + 1}. [${visibility}] ${authorLabel}\n`;
          summary += `   Comment ID: ${comment.id} | Created: ${comment.created_at}\n`;
          summary += `   Preview: ${(comment.body || '').substring(0, 100)}${comment.body && comment.body.length > 100 ? '...' : ''}\n`;
          if (comment.attachments && comment.attachments.length > 0) {
            summary += `   📎 Attachments: ${comment.attachments.length} file(s)\n`;
            comment.attachments.forEach((att, idx) => {
              const fileName = att.file_name || att.filename || 'Unknown';
              const contentUrl = att.content_url || att.url || null;
              summary += `      ${idx + 1}. ${fileName}`;
              if (contentUrl) {
                summary += ` - 🔗 ${contentUrl}`;
              }
              summary += `\n`;
            });
          }
          summary += `\n`;
        });

        // Include full JSON for detailed access
        const summaryData = {
          ticket_id: id,
          total_count: totalCount,
          fetched_count: allComments.length,
          public_count: publicComments.length,
          private_count: privateComments.length,
          customer_count: customerComments.length,
          agent_count: agentComments.length,
          comments: allComments.map(comment => {
            const info = authorInfo.get(comment.author_id);
            return {
              ...comment,
              author_info: info || null
            };
          })
        };

        summary += `\n=== FULL JSON DATA ===\n${JSON.stringify(summaryData, null, 2)}`;

        return {
          content: [{
            type: "text",
            text: summary
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error summarizing ticket comments: ${error.message}` }],
          isError: true
        };
      }
    }
  },
  {
    name: "get_ticket_comment",
    description: "Get a specific comment by ID from a ticket. PREFERRED over list_ticket_comments when you have the comment ID. Clearly shows if the comment is public or private.",
    schema: {
      ticket_id: z.number().int().describe("Ticket ID"),
      comment_id: z.number().int().describe("Comment ID")
    },
    handler: async ({ ticket_id, comment_id }) => {
      try {
        const result = await zendeskClient.getTicketComment(ticket_id, comment_id);
        const comment = result.comment || result;

        // Format output to make public/private status very obvious
        const visibility = comment.public === true ? '🔓 PUBLIC' : '🔒 PRIVATE';
        let formattedOutput = `=== COMMENT ${comment_id} (Ticket ${ticket_id}) ===\n\n`;
        formattedOutput += `VISIBILITY: ${visibility}\n`;
        formattedOutput += `Public: ${comment.public}\n`;
        formattedOutput += `ID: ${comment.id}\n`;
        formattedOutput += `Author ID: ${comment.author_id}\n`;
        formattedOutput += `Created: ${comment.created_at}\n`;
        formattedOutput += `\n=== BODY ===\n${comment.body}\n`;

        if (comment.attachments && comment.attachments.length > 0) {
          formattedOutput += `\n=== ATTACHMENTS (${comment.attachments.length}) ===\n`;
          comment.attachments.forEach((att, idx) => {
            const fileName = att.file_name || att.filename || 'Unknown';
            const contentType = att.content_type || 'Unknown';
            const contentUrl = att.content_url || att.url || null;
            formattedOutput += `${idx + 1}. ${fileName} (${contentType})`;
            if (contentUrl) {
              formattedOutput += `\n   🔗 URL: ${contentUrl}`;
            }
            formattedOutput += `\n`;
          });
        }

        formattedOutput += `\n\n=== RAW JSON ===\n${JSON.stringify(result, null, 2)}`;

        return {
          content: [{
            type: "text",
            text: formattedOutput
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error getting ticket comment: ${error.message}` }],
          isError: true
        };
      }
    }
  },
  {
    name: "create_ticket",
    description: "Create a new ticket in Zendesk. MODERATE RISK: This will create new data. Requires subject and comment. Returns the created ticket with its ID.",
    schema: {
      subject: z.string().describe("Ticket subject"),
      comment: z.string().describe("Ticket comment/description"),
      priority: z.enum(["urgent", "high", "normal", "low"]).optional().describe("Ticket priority"),
      status: z.enum(["new", "open", "pending", "hold", "solved", "closed"]).optional().describe("Ticket status"),
      requester_id: z.number().int().optional().describe("User ID of the requester"),
      assignee_id: z.number().int().optional().describe("User ID of the assignee"),
      group_id: z.number().int().optional().describe("Group ID for the ticket"),
      type: z.enum(["problem", "incident", "question", "task"]).optional().describe("Ticket type"),
      tags: z.array(z.string()).optional().describe("Tags for the ticket")
    },
    handler: async ({ subject, comment, priority, status, requester_id, assignee_id, group_id, type, tags }) => {
      try {
        const ticketData = {
          subject,
          comment: { body: comment },
          priority,
          status,
          requester_id,
          assignee_id,
          group_id,
          type,
          tags
        };

        const result = await zendeskClient.createTicket(ticketData);
        return {
          content: [{
            type: "text",
            text: `Ticket created successfully!\n\n${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error creating ticket: ${error.message}` }],
          isError: true
        };
      }
    }
  },
  {
    name: "update_ticket",
    description: "Update an existing ticket by ID. MODERATE RISK: This will modify existing data. Supports updating standard fields (subject, status, priority, assignee, group, type, tags) and custom fields. Returns the updated ticket.",
    schema: {
      id: z.number().int().describe("Ticket ID to update"),
      subject: z.string().optional().describe("Updated ticket subject"),
      comment: z.string().optional().describe("New comment to add"),
      priority: z.enum(["urgent", "high", "normal", "low"]).optional().describe("Updated ticket priority"),
      status: z.enum(["new", "open", "pending", "hold", "solved", "closed"]).optional().describe("Updated ticket status"),
      assignee_id: z.number().int().optional().describe("User ID of the new assignee"),
      group_id: z.number().int().optional().describe("New group ID for the ticket"),
      type: z.enum(["problem", "incident", "question", "task"]).optional().describe("Updated ticket type"),
      tags: z.array(z.string()).optional().describe("Updated tags for the ticket"),
      custom_fields: z.array(z.object({
        id: z.union([z.number().int(), z.string()]).describe("Custom field ID"),
        value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()]).describe("Value to set for the custom field")
      })).optional().describe("Array of custom fields to update")
    },
    handler: async ({ id, subject, comment, priority, status, assignee_id, group_id, type, tags, custom_fields }) => {
      try {
        const ticketData = {};

        if (subject !== undefined) ticketData.subject = subject;
        if (comment !== undefined) ticketData.comment = { body: comment };
        if (priority !== undefined) ticketData.priority = priority;
        if (status !== undefined) ticketData.status = status;
        if (assignee_id !== undefined) ticketData.assignee_id = assignee_id;
        if (group_id !== undefined) ticketData.group_id = group_id;
        if (type !== undefined) ticketData.type = type;
        if (tags !== undefined) ticketData.tags = tags;
        if (custom_fields !== undefined && custom_fields.length > 0) ticketData.custom_fields = custom_fields;

        const result = await zendeskClient.updateTicket(id, ticketData);
        return {
          content: [{
            type: "text",
            text: `Ticket updated successfully!\n\n${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error updating ticket: ${error.message}` }],
          isError: true
        };
      }
    }
  },
  // Note: delete_ticket tool commented out for security - tickets contain important customer data
  // Uncomment below to re-enable delete functionality
  /*
  {
    name: "delete_ticket",
    description: "Delete a ticket",
    schema: {
      id: z.number().int().describe("Ticket ID to delete")
    },
    handler: async ({ id }) => {
      try {
        await zendeskClient.deleteTicket(id);
        return {
          content: [{ 
            type: "text", 
            text: `Ticket ${id} deleted successfully!`
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error deleting ticket: ${error.message}` }],
          isError: true
        };
      }
    }
  }
  */
];
