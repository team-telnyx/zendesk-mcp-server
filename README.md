# Zendesk API MCP Server

A comprehensive Model Context Protocol (MCP) server for interacting with the Zendesk API. This server provides tools and resources for managing Zendesk Support, Talk, Chat, and Guide products.

## Features

- Complete coverage of Zendesk API functionality
- Tools for managing tickets, users, organizations, and more
- Resources for accessing Zendesk API documentation
- Secure authentication with Zendesk API tokens
- **Enhanced client logging and connection monitoring**
- **Real-time connection tracking with automatic memory cleanup**

## Getting Started

### Prerequisites

- Node.js 14 or higher
- A Zendesk account with API access

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your Zendesk credentials:
   ```
   ZENDESK_SUBDOMAIN=your-subdomain
   ZENDESK_EMAIL=your-email@example.com
   ZENDESK_API_TOKEN=your-api-token
   ```

### Running the Server

This server supports two transport methods:

#### 1. Stdio Transport (Local Development)
The stdio transport communicates via stdin/stdout pipes and **does not use a network port**. This is ideal for:
- Local development with MCP Inspector
- Claude Desktop when configured for stdio transport
- Direct process-to-process communication

Start the stdio server:
```
npm start
```

For development with auto-restart:
```
npm run dev
```

**Expected output:**
```
Starting Zendesk API MCP server...
✅ Zendesk MCP server ready and waiting for connections (stdio transport)
```

The server will then wait for MCP protocol messages on stdin. This is normal behavior - the server is ready and waiting for connections.

#### 2. Streamable HTTP Transport (Remote Deployment)
The HTTP transport runs a web server on a network port, ideal for:
- Remote deployments
- Kubernetes/Docker environments
- Multiple clients connecting simultaneously
- Production environments

Start the HTTP server:
```
npm run start:http
```

For development with auto-restart:
```
npm run dev:http
```

**Expected output:**
```
🚀 Zendesk MCP Server running on http (port 3000)
Environment: local
Authentication: Enabled (Bearer token required)
Client logging: Enhanced with IP tracking and error monitoring
Streamable HTTP MCP: http://localhost:3000/mcp
Health Check: http://localhost:3000/health
Connections: http://localhost:3000/connections
Metrics: http://localhost:3000/metrics
```

The HTTP server runs on **port 3000** by default (or the value of the `PORT` environment variable) with:
- Streamable HTTP MCP endpoint: `http://localhost:3000/mcp`
- Health check: `http://localhost:3000/health`
- Connection monitoring: `http://localhost:3000/connections`
- Metrics: `http://localhost:3000/metrics`

### Testing MCP Server

This repository includes a comprehensive test script to verify that MCP tools are accessible through both transport methods.

#### Test Stdio Transport (Local Development)
```bash
# Test the stdio transport with 53 Zendesk API tools
node test-mcp.js
```

#### Test Streamable HTTP Transport (Remote Deployment)
```bash
# Start the HTTP server in one terminal
npm run start:http

# In another terminal, test the HTTP transport
node test-mcp.js http
```

#### Test with MCP Inspector
Test the stdio server using the official MCP Inspector:
```bash
npm run inspect
```

The test script will verify:
- ✅ Server connectivity via both transports
- ✅ Tool discovery (should find 53 tools)
- ✅ Basic MCP protocol functionality
- 🔍 Sample tool names: `list_tickets`, `get_ticket`, `list_ticket_comments`, `summarize_ticket_comments`, `count_ticket_comments`, `get_ticket_comment`, `create_ticket`, `update_ticket`, `delete_ticket`, ...

## Remote Deployment

This server can be deployed remotely using Telnyx's internal infrastructure:

### Development Environment
```bash
# Deploy to dev environment
git push origin main
# Jenkins will automatically build and deploy to dev k8s cluster
```

### Production Environment
```bash
# Deploy to production environment
# (requires approval and proper CI/CD process)
```

### Docker

Build and run with Docker:
```bash
make build
make start
```

### Connecting to Remote Server

To connect to the remote MCP server from Claude Code:

1. **Streamable HTTP Connection**: Use the HTTP endpoint
   ```
   [http://zendesk-mcp-server.internal.telnyx.com:3000/mcp](http://zendesk-mcp-server.query.prod.telnyx.io:3000/mcp)
   ```

2. **Configure in Claude Code**: Add as a remote MCP server in your configuration using the Streamable HTTP transport

## Available Tools

### Tickets
- `list_tickets`: List tickets in Zendesk
- `get_ticket`: Get a specific ticket by ID
- `list_ticket_comments`: List all comments (public and private) for a specific ticket with pagination support. **Output clearly shows 🔓 PUBLIC or 🔒 PRIVATE for each comment.** Supports `page`, `per_page`, `sort_order` parameters.
- `summarize_ticket_comments`: **Automatically fetches ALL comments across multiple pages** and provides a summary showing public vs private breakdown **and customer vs agent identification**. Fetches author role information to identify which comments are from customers vs support agents. Best tool for AI agents to get complete comment context without truncation.
- `count_ticket_comments`: Get the count of comments (public and private) for a specific ticket
- `get_ticket_comment`: Get a specific comment by ID from a ticket. **Clearly shows if comment is public or private.**
- `create_ticket`: Create a new ticket
- `update_ticket`: Update an existing ticket
- `delete_ticket`: Delete a ticket

### Users
- `list_users`: List users in Zendesk
- `get_user`: Get a specific user by ID
- `create_user`: Create a new user
- `update_user`: Update an existing user
- `delete_user`: Delete a user

### Organizations
- `list_organizations`: List organizations in Zendesk
- `get_organization`: Get a specific organization by ID
- `create_organization`: Create a new organization
- `update_organization`: Update an existing organization
- `delete_organization`: Delete an organization

### Groups
- `list_groups`: List agent groups in Zendesk
- `get_group`: Get a specific group by ID
- `create_group`: Create a new agent group
- `update_group`: Update an existing group
- `delete_group`: Delete a group

### Macros
- `list_macros`: List macros in Zendesk
- `get_macro`: Get a specific macro by ID
- `create_macro`: Create a new macro
- `update_macro`: Update an existing macro
- `delete_macro`: Delete a macro

### Views
- `list_views`: List views in Zendesk
- `get_view`: Get a specific view by ID
- `create_view`: Create a new view
- `update_view`: Update an existing view
- `delete_view`: Delete a view

### Triggers
- `list_triggers`: List triggers in Zendesk
- `get_trigger`: Get a specific trigger by ID
- `create_trigger`: Create a new trigger
- `update_trigger`: Update an existing trigger
- `delete_trigger`: Delete a trigger

### Automations
- `list_automations`: List automations in Zendesk
- `get_automation`: Get a specific automation by ID
- `create_automation`: Create a new automation
- `update_automation`: Update an existing automation
- `delete_automation`: Delete an automation

### Search
- `search`: Search across Zendesk data

### Help Center
- `list_articles`: List Help Center articles
- `get_article`: Get a specific Help Center article by ID
- `create_article`: Create a new Help Center article
- `update_article`: Update an existing Help Center article
- `delete_article`: Delete a Help Center article

### Talk
- `get_talk_stats`: Get Zendesk Talk statistics

### Chat
- `list_chats`: List Zendesk Chat conversations

### Support
- `list_risky_tools`: **List all risky tools that can modify or delete data.** Use this to identify which tools require caution. Supports filtering by risk level (all, high_risk, moderate_risk).
- `list_safe_tools`: **List all safe (read-only) tools** that only fetch, list, or read information without modifying data.
- `support_info`: Get information about Zendesk Support configuration

## Available Resources

- `zendesk://docs/{section}`: Access documentation for different sections of the Zendesk API
- `zendesk://tools/{category}`: Access tool safety information
  - `zendesk://tools/summary`: Get a summary of safe vs risky tools
  - `zendesk://tools/risky`: List all risky tools (create, update, delete operations)
  - `zendesk://tools/safe`: List all safe tools (read-only operations)
  - `zendesk://tools/all`: List all risky tools

## Tool Safety Classification

All tools are automatically classified and labeled:

- **✅ SAFE (Read-only)**: Tools that only fetch, list, or read information. These tools have no risk of modifying data.
  - Examples: `list_tickets`, `get_ticket`, `list_ticket_comments`, `search`, etc.
  - Tool descriptions are prefixed with: `✅ SAFE (Read-only):`

- **⚠️ MODERATE RISK**: Tools that create or update data in Zendesk.
  - Examples: `create_ticket`, `update_ticket`, `create_user`, `update_organization`, etc.
  - Tool descriptions are prefixed with: `⚠️ MODERATE RISK:`

- **⚠️ HIGH RISK**: Tools that delete data in Zendesk.
  - Examples: `delete_ticket`, `delete_user`, `delete_organization`, etc.
  - Tool descriptions are prefixed with: `⚠️ HIGH RISK:`

**For AI Agents**: 
- **Use `list_risky_tools` tool** to see all risky tools before executing any operations
- **Use `list_safe_tools` tool** to see all safe read-only tools
- Check tool descriptions which are prefixed with risk indicators (✅ SAFE, ⚠️ MODERATE RISK, ⚠️ HIGH RISK)
- Access `zendesk://tools/summary` resource to see a complete breakdown of safe vs risky tools

## Connection Monitoring

The server includes comprehensive client logging and monitoring capabilities:

### Enhanced Logging Features
- **Client IP tracking**: Identifies client IPs including proxy-forwarded addresses
- **User-Agent logging**: Captures client application information
- **Connection duration tracking**: Monitors session lifetimes
- **Real-time session monitoring**: Shows active connections and total counts
- **Error tracking**: Detailed logging of connection failures with client context

### Monitoring Endpoints

#### `/connections` - Real-time Connection Status
```bash
curl http://localhost:3000/connections
```
Returns detailed information about:
- Active MCP sessions with client details
- Server uptime and connection statistics  
- Memory usage and cleanup status
- Session duration and client identification

#### `/health` - Server Health Check
```bash
curl http://localhost:3000/health
```
Basic server health status for monitoring systems.

#### `/metrics` - Prometheus Metrics
```bash
curl http://localhost:3000/metrics
```
Prometheus-compatible metrics including:
- `zendesk_mcp_server_up` - Server status
- `zendesk_mcp_server_active_sessions` - Active session count
- `zendesk_mcp_server_total_connections` - Total connection counter

### Memory Management
- **Automatic cleanup**: Stale sessions cleaned after 30 minutes
- **Memory bounds**: Recent client cache limited to 30 seconds
- **Periodic reporting**: Health reports every 5 minutes
- **Fail-safe mechanisms**: Prevents memory leaks from crashed clients

### Example Console Output
```
🚀 Zendesk MCP Server running on http (port 3000)
Client logging: Enhanced with IP tracking and error monitoring

🔌 MCP session initialized: abc-123 (#1)
   Client: 192.168.1.100 | Claude-Desktop/1.0
   Active sessions: 1

✓ MCP request completed (150ms) - 192.168.1.100

📊 Health Report: 1 active MCP sessions | Total connections: 1
   - abc-123: 192.168.1.100
```

All logging is purely observational and does not affect MCP protocol communication or tool functionality.

## License

MIT
