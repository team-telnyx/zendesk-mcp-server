#!/usr/bin/env node
import express from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { server } from './server.js';
import dotenv from 'dotenv';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const isLocalInstance = process.env.LOCAL === 'true';
const environment = process.env.ENV || (isLocalInstance ? 'local' : 'dev');

// Color codes for terminal output (similar to noc-chatbot)
const BLUE = '\x1b[94m';
const GREEN = '\x1b[32m';
const NC = '\x1b[0m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';

// Environment-aware URL helper
const getBaseUrl = () => {
  if (isLocalInstance) {
    return `http://localhost:${port}`;
  }
  // Kubernetes environment URLs
  if (environment === 'dev') {
    return 'http://zendesk-mcp-server.query.dev.telnyx.io:3000';
  }
  if (environment === 'prod') {
    return 'http://zendesk-mcp-server.query.prod.telnyx.io:3000';
  }
  return `http://localhost:${port}`;
};

// Enable JSON parsing
app.use(express.json());

// Setup Morgan logging middleware (similar to noc-chatbot)
morgan.token('colored-status', (req, res) => {
  const status = res.statusCode;
  let color = '';

  if (status >= 200 && status < 300) {
    color = GREEN; // Green for 2xx
  } else if (status >= 400 && status < 600) {
    color = RED; // Red for 4xx and 5xx
  } else {
    color = BLUE; // Blue for other statuses
  }

  return `${color}${status}${NC}`;
});

morgan.token('colored-method', (req) => {
  const method = req.method;
  let color = '';

  switch (method) {
    case 'GET':
      color = GREEN;
      break;
    case 'POST':
    case 'PUT':
      color = BLUE;
      break;
    case 'PATCH':
      color = YELLOW;
      break;
    case 'DELETE':
      color = RED;
      break;
    default:
      color = BLUE;
  }

  return `${color}${method}${NC}`;
});

// Logging Middleware that outputs incoming request data
app.use(morgan(`[:date[iso]] :colored-method :url :colored-status (:response-time ms)`));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'zendesk-mcp-server',
    environment,
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
    console.log(`${GREEN}MCP session initialized: ${sessionId}${NC}`);
  },
  onsessionclosed: (sessionId) => {
    console.log(`${YELLOW}MCP session closed: ${sessionId}${NC}`);
  }
});

// Connect the server to the transport
server.connect(transport);

// Handle MCP requests at /mcp endpoint
app.all('/mcp', async (req, res) => {
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error(`${RED}Error handling MCP request:${NC}`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.listen(port, () => {
  const baseUrl = getBaseUrl();
  
  console.log(`${GREEN}Server running on http (port ${port})${NC}`);
  console.log(`${BLUE}Environment: ${environment}${NC}`);
  
  if (isLocalInstance) {
    // Local development - show localhost URLs
    console.log(`${GREEN}Streamable HTTP MCP: ${baseUrl}/mcp${NC}`);
    console.log(`${GREEN}Health Check: ${baseUrl}/health${NC}`);
    console.log(`${GREEN}Metrics: ${baseUrl}/metrics${NC}`);
  } else {
    // Remote environment (dev/prod) - show remote URLs
    console.log(`${GREEN}Streamable HTTP MCP: ${baseUrl}/mcp${NC}`);
    console.log(`${GREEN}Health Check: ${baseUrl}/health${NC}`);
    console.log(`${GREEN}Metrics: ${baseUrl}/metrics${NC}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});