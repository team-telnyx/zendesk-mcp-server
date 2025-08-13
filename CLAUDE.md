# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development (stdio transport)
- `npm start` - Start the MCP server
- `npm run dev` - Start the server with auto-restart using Node's watch mode
- `npm run inspect` - Test the server using the MCP Inspector tool

### Remote Deployment (Streamable HTTP transport)
- `npm run start:http` - Start the Streamable HTTP server for remote access
- `npm run dev:http` - Start the Streamable HTTP server with auto-restart
- `make build` - Build Docker image for deployment
- `make start` - Start Docker container locally

## Environment Setup

The server requires Zendesk API credentials in a `.env` file:
```
ZENDESK_SUBDOMAIN=your-subdomain
ZENDESK_EMAIL=your-email@example.com
ZENDESK_API_TOKEN=your-api-token

# Optional: MCP authentication token for HTTP transport
# If set, clients must provide "Authorization: Bearer <token>" header
# If not set, no authentication required (local development)
MCP_AUTH_TOKEN=your-mcp-auth-token
```

## Architecture Overview

This is a Model Context Protocol (MCP) server that provides comprehensive access to the Zendesk API. The architecture follows a modular pattern:

### Core Components

1. **Entry Point** (`src/index.js`): Sets up stdio transport and connects the server
2. **Server Configuration** (`src/server.js`): Defines the MCP server, registers all tools, and provides documentation resources
3. **Zendesk Client** (`src/zendesk-client.js`): Centralized HTTP client for all Zendesk API interactions using Basic authentication

### Tool Organization

Tools are organized by Zendesk functionality in `src/tools/`:
- Each tool module exports an array of tool definitions
- Tools follow a consistent pattern: name, description, Zod schema, and async handler
- All tools use the shared `zendeskClient` instance
- Error handling is standardized across all tools

### Tool Structure Pattern

Each tool follows this structure:
```javascript
{
  name: "tool_name",
  description: "Tool description",
  schema: { /* Zod validation schema */ },
  handler: async (params) => { /* Implementation */ }
}
```

### API Coverage

The server provides comprehensive coverage of Zendesk APIs:
- **Core Support**: Tickets, Users, Organizations, Groups
- **Automation**: Macros, Views, Triggers, Automations
- **Content**: Help Center articles, Search
- **Communication**: Talk statistics, Chat conversations

### Resource System

The server exposes a documentation resource at `zendesk://docs/{section}` that provides API documentation for different sections of the Zendesk API.

### Authentication

Uses Zendesk's email/token authentication method with Basic auth headers. The client validates credentials on initialization and provides clear error messages for missing configuration.

### Error Handling

Consistent error handling pattern:
- API errors include HTTP status codes and response details
- Missing credentials return helpful configuration messages
- All tool handlers include try/catch blocks with standardized error responses

## Remote Deployment

The server supports both local stdio transport and remote Streamable HTTP transport for deployment.

### Architecture for Remote Access

- **HTTP Server**: Express.js server with health and metrics endpoints
- **Streamable HTTP Transport**: Modern MCP transport using HTTP with SSE streaming at `/mcp` endpoint
- **Session Management**: Stateful sessions with UUID-based session IDs for connection tracking
- **Docker**: Containerized for deployment to Telnyx's Kubernetes infrastructure
- **CI/CD**: Jenkins pipeline with automated builds and deployments

### Deployment Files

- `src/http-server.js` - Streamable HTTP transport layer
- `Dockerfile` - Container definition
- `meta-dev.yml` / `meta-prod.yml` - Kubernetes deployment configs
- `Jenkinsfile` - CI/CD pipeline
- `Makefile` - Build automation
- `test-mcp.js` - Test script to verify both stdio and HTTP transport functionality

### Remote Connection

Clients connect via Streamable HTTP: `http://zendesk-mcp-server.internal.telnyx.com:3000/mcp`

For remote connections, if `MCP_AUTH_TOKEN` is configured, clients must include authentication:
```
Authorization: Bearer <your-mcp-auth-token>
```

### Testing

To verify the MCP server is working and tools are accessible:

```bash
# Test stdio transport
node test-mcp.js

# Test Streamable HTTP transport (start server first)
npm run start:http
node test-mcp.js http
```

Both transports expose 49 Zendesk API tools including tickets, users, organizations, groups, macros, views, triggers, automations, search, help center, support info, talk statistics, and chat functionality.