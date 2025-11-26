#!/usr/bin/env node
    import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
    import { createServer } from './server.js';
    import dotenv from 'dotenv';

    // Load environment variables
    dotenv.config();

    console.log('Starting Zendesk API MCP server...');

    // Create server instance
    const server = createServer();

    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    await server.connect(transport);
