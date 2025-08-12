# Zendesk API MCP Server

    A comprehensive Model Context Protocol (MCP) server for interacting with the Zendesk API. This server provides tools and resources for managing Zendesk Support, Talk, Chat, and Guide products.

    ## Features

    - Complete coverage of Zendesk API functionality
    - Tools for managing tickets, users, organizations, and more
    - Resources for accessing Zendesk API documentation
    - Secure authentication with Zendesk API tokens

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

    #### Local Development (stdio transport)
    Start the server:
    ```
    npm start
    ```

    For development with auto-restart:
    ```
    npm run dev
    ```

    #### Remote Deployment (Streamable HTTP transport)
    Start the Streamable HTTP server for remote access:
    ```
    npm run start:http
    ```

    For development with auto-restart:
    ```
    npm run dev:http
    ```

    The server will run on port 3000 (or PORT env variable) with:
    - Streamable HTTP MCP endpoint: `http://localhost:3000/mcp`
    - Health check: `http://localhost:3000/health`
    - Metrics: `http://localhost:3000/metrics`

    ### Testing MCP Server

    This repository includes a comprehensive test script to verify that MCP tools are accessible through both transport methods.

    #### Test Stdio Transport (Local Development)
    ```bash
    # Test the stdio transport with 49 Zendesk API tools
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
    - ✅ Tool discovery (should find 49 tools)
    - ✅ Basic MCP protocol functionality
    - 🔍 Sample tool names: `list_tickets`, `get_ticket`, `create_ticket`, `update_ticket`, `delete_ticket`, ...

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
       http://zendesk-mcp-server.internal.telnyx.com:3000/mcp
       ```

    2. **Configure in Claude Code**: Add as a remote MCP server in your configuration using the Streamable HTTP transport

    ## Available Tools

    ### Tickets
    - `list_tickets`: List tickets in Zendesk
    - `get_ticket`: Get a specific ticket by ID
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

    ## Available Resources

    - `zendesk://docs/{section}`: Access documentation for different sections of the Zendesk API

    ## License

    MIT
