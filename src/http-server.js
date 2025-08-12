#!/usr/bin/env node
import express from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { server } from './server.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable JSON parsing
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'zendesk-mcp-server',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint (for Telnyx monitoring)
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`# HELP zendesk_mcp_server_up Server is running
# TYPE zendesk_mcp_server_up gauge
zendesk_mcp_server_up 1
`);
});

// Create Streamable HTTP transport
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  onsessioninitialized: (sessionId) => {
    console.log(`New MCP session initialized: ${sessionId}`);
  },
  onsessionclosed: (sessionId) => {
    console.log(`MCP session closed: ${sessionId}`);
  }
});

// Connect the server to the transport
server.connect(transport);

// Handle MCP requests at /mcp endpoint
app.all('/mcp', async (req, res) => {
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.listen(port, () => {
  console.log(`Zendesk MCP server running on port ${port}`);
  console.log(`Streamable HTTP MCP endpoint: http://localhost:${port}/mcp`);
  console.log(`Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});