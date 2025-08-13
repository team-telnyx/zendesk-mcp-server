#!/usr/bin/env node
import express from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import dotenv from 'dotenv';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

// Authentication configuration
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

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

// Enable JSON parsing (exclude MCP endpoint which handles raw requests)
app.use('/mcp', express.raw({ type: '*/*' })); // Raw body for MCP
app.use((req, res, next) => {
  if (req.path === '/mcp') {
    return next(); // Skip JSON parsing for MCP
  }
  express.json()(req, res, next); // Apply JSON parsing for other routes
});

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

// Enhanced logging format with client info
morgan.token('client-ip', (req) => {
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0];
});

morgan.token('user-agent', (req) => {
  return req.get('User-Agent') || 'unknown';
});

// Logging Middleware that outputs incoming request data with client info
app.use(morgan(`[:date[iso]] :client-ip ":user-agent" :colored-method :url :colored-status (:response-time ms)`));

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

# HELP zendesk_mcp_server_active_sessions Number of active MCP sessions
# TYPE zendesk_mcp_server_active_sessions gauge
zendesk_mcp_server_active_sessions ${activeConnections.size}

# HELP zendesk_mcp_server_total_connections Total number of connections since start
# TYPE zendesk_mcp_server_total_connections counter
zendesk_mcp_server_total_connections ${connectionCounter}
`);
});

// Connections status endpoint
app.get('/connections', (req, res) => {
  const now = Date.now();
  const uptimeMs = now - serverStartTime;
  
  const activeSessions = Array.from(activeConnections).map(sessionId => {
    const clientInfo = sessionClientInfo.get(sessionId);
    const startTime = sessionTimestamps.get(sessionId);
    const duration = startTime ? now - startTime : 0;
    const hasServerInstance = sessionServers.has(sessionId);
    
    return {
      sessionId,
      ip: clientInfo?.ip || 'unknown',
      userAgent: clientInfo?.userAgent || 'unknown',
      host: clientInfo?.host || 'unknown',
      connectedAt: startTime ? new Date(startTime).toISOString() : 'unknown',
      durationMs: duration,
      durationHuman: duration > 0 ? `${Math.floor(duration / 1000)}s` : 'unknown',
      hasServerInstance,
      architecture: 'per-session-server'
    };
  });

  res.json({
    server: {
      startedAt: new Date(serverStartTime).toISOString(),
      uptimeMs,
      uptimeHuman: `${Math.floor(uptimeMs / 1000)}s`,
      environment
    },
    connections: {
      active: activeConnections.size,
      total: connectionCounter,
      sessions: activeSessions
    },
    memory: {
      sessionInfoEntries: sessionClientInfo.size,
      sessionServers: sessionServers.size,
      sessionTimestamps: sessionTimestamps.size,
      sessionTimeoutMs: SESSION_TIMEOUT,
      cleanupIntervalMs: CLEANUP_INTERVAL,
      lastCleanupWould: `Clean ${Array.from(sessionTimestamps.values()).filter(ts => now - ts > SESSION_TIMEOUT).length} stale sessions`
    },
    timestamp: new Date().toISOString()
  });
});

// Per-session server management
const sessionServers = new Map(); // sessionId -> { server, transport }
const sessionClientInfo = new Map(); // sessionId -> client info  
const sessionTimestamps = new Map(); // sessionId -> timestamp
const activeConnections = new Set(); // active session IDs
let connectionCounter = 0;
let serverStartTime = Date.now();

// Memory cleanup configuration
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes - sessions older than this are considered stale
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes - how often to run cleanup

// Authentication middleware
const authenticateRequest = (req, res, next) => {
  // Skip authentication if no token is configured (local development)
  if (!MCP_AUTH_TOKEN) {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Bearer token required',
      timestamp: new Date().toISOString()
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (token !== MCP_AUTH_TOKEN) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Helper to get client info from request
const getClientInfo = (req) => {
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
             (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
             req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const host = req.get('Host') || 'unknown';
  return { ip, userAgent, host };
};


// Per-session transport factory
function createSessionTransport(sessionId) {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => sessionId,
    onsessioninitialized: (actualSessionId) => {
      activeConnections.add(actualSessionId);
      console.log(`${GREEN}🔌 MCP session initialized: ${actualSessionId}${NC}`);
    },
    onsessionclosed: (actualSessionId) => {
      const clientInfo = sessionClientInfo.get(actualSessionId);
      const startTime = sessionTimestamps.get(actualSessionId);
      const duration = startTime ? Date.now() - startTime : 0;
      
      console.log(`${YELLOW}🔌 MCP session closed: ${actualSessionId} - Duration: ${Math.floor(duration / 1000)}s${NC}`);
      
      // Cleanup session data
      activeConnections.delete(actualSessionId);
      sessionServers.delete(actualSessionId);
      sessionClientInfo.delete(actualSessionId);
      sessionTimestamps.delete(actualSessionId);
      
      console.log(`${BLUE}   Active sessions: ${activeConnections.size}${NC}`);
    }
  });
  
  return transport;
}

// MCP endpoint with per-session server isolation
app.all('/mcp', authenticateRequest, async (req, res) => {
  const clientInfo = getClientInfo(req);
  const startTime = Date.now();
  
  // Parse JSON body if it's a buffer (from express.raw)
  let parsedBody = req.body;
  if (Buffer.isBuffer(req.body)) {
    try {
      parsedBody = JSON.parse(req.body.toString());
    } catch (e) {
      parsedBody = {};
    }
  }
  
  // Generate or get session ID from headers
  let sessionId = req.headers['mcp-session-id'] || randomUUID();
  
  console.log(`${BLUE}🔍 MCP Request Details:${NC}`);
  console.log(`${BLUE}   Session ID: ${sessionId}${NC}`);
  console.log(`${BLUE}   Method: ${req.method}${NC}`);
  console.log(`${BLUE}   MCP Method: ${parsedBody?.method}${NC}`);
  console.log(`${BLUE}   Client: ${clientInfo.ip}${NC}`);
  
  try {
    // Get or create server instance for this session
    let sessionData = sessionServers.get(sessionId);
    
    if (!sessionData) {
      console.log(`${GREEN}🆕 Creating new server instance for session ${sessionId}${NC}`);
      
      // Create new server and transport for this session
      const sessionServer = createServer();
      const sessionTransport = createSessionTransport(sessionId);
      
      // Connect server to transport
      sessionServer.connect(sessionTransport);
      
      // Store session data
      sessionData = { server: sessionServer, transport: sessionTransport };
      sessionServers.set(sessionId, sessionData);
      sessionClientInfo.set(sessionId, clientInfo);
      sessionTimestamps.set(sessionId, startTime);
      
      connectionCounter++;
      console.log(`${BLUE}   Client: ${clientInfo.ip} | ${clientInfo.userAgent}${NC}`);
      console.log(`${BLUE}   Active sessions: ${sessionServers.size}${NC}`);
    } else {
      console.log(`${BLUE}♻️  Using existing server instance for session ${sessionId}${NC}`);
    }
    
    // Handle the request with the session-specific transport
    await sessionData.transport.handleRequest(req, res, parsedBody);
    
    const duration = Date.now() - startTime;
    console.log(`${GREEN}✓ MCP request completed (${duration}ms) - ${sessionId} - ${clientInfo.ip}${NC}`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorType = error.name || 'Unknown';
    const errorMsg = error.message || 'Unknown error';
    
    console.error(`${RED}❌ MCP request failed (${duration}ms)${NC}`);
    console.error(`${RED}   Session ID: ${sessionId}${NC}`);
    console.error(`${RED}   Client: ${clientInfo.ip}${NC}`);
    console.error(`${RED}   Error Type: ${errorType}${NC}`);
    console.error(`${RED}   Error Message: ${errorMsg}${NC}`);
    console.error(`${RED}   Method: ${req.method} ${req.url}${NC}`);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: randomUUID()
      });
    }
  }
});

// Memory cleanup function
const cleanupStaleSessions = () => {
  const now = Date.now();
  let cleanedCount = 0;

  // Clean up stale sessions that never properly closed
  for (const [sessionId, timestamp] of sessionTimestamps) {
    if (now - timestamp > SESSION_TIMEOUT) {
      // Session is stale - clean it up
      activeConnections.delete(sessionId);
      sessionServers.delete(sessionId);
      sessionClientInfo.delete(sessionId);
      sessionTimestamps.delete(sessionId);
      cleanedCount++;
      
      console.log(`${YELLOW}🧹 Cleaned up stale session: ${sessionId} (${Math.floor((now - timestamp) / 1000)}s old)${NC}`);
    }
  }

  if (cleanedCount > 0) {
    console.log(`${BLUE}🧹 Memory cleanup: ${cleanedCount} stale sessions${NC}`);
    console.log(`${BLUE}   Active sessions: ${activeConnections.size} | Total servers: ${sessionServers.size}${NC}`);
  }
};

// Periodic connection health reporting and cleanup (every 5 minutes)
setInterval(() => {
  // Health reporting
  if (activeConnections.size > 0) {
    console.log(`${BLUE}📊 Health Report: ${activeConnections.size} active MCP sessions | Total connections: ${connectionCounter}${NC}`);
    
    // Show client info for active sessions
    for (const [sessionId, clientInfo] of sessionClientInfo) {
      if (activeConnections.has(sessionId)) {
        console.log(`${BLUE}   - ${sessionId}: ${clientInfo.ip}${NC}`);
      }
    }
  }
  
  // Memory cleanup
  cleanupStaleSessions();
}, CLEANUP_INTERVAL);

app.listen(port, () => {
  const baseUrl = getBaseUrl();
  
  console.log(`${GREEN}🚀 Zendesk MCP Server running on http (port ${port})${NC}`);
  console.log(`${BLUE}Environment: ${environment}${NC}`);
  console.log(`${BLUE}Authentication: ${MCP_AUTH_TOKEN ? 'Enabled (Bearer token required)' : 'Disabled (local development)'}${NC}`);
  console.log(`${BLUE}Client logging: Enhanced with IP tracking and error monitoring${NC}`);
  
  if (isLocalInstance) {
    // Local development - show localhost URLs
    console.log(`${GREEN}Streamable HTTP MCP: ${baseUrl}/mcp${NC}`);
    console.log(`${GREEN}Health Check: ${baseUrl}/health${NC}`);
    console.log(`${GREEN}Connections: ${baseUrl}/connections${NC}`);
    console.log(`${GREEN}Metrics: ${baseUrl}/metrics${NC}`);
  } else {
    // Remote environment (dev/prod) - show remote URLs
    console.log(`${GREEN}Streamable HTTP MCP: ${baseUrl}/mcp${NC}`);
    console.log(`${GREEN}Health Check: ${baseUrl}/health${NC}`);
    console.log(`${GREEN}Connections: ${baseUrl}/connections${NC}`);
    console.log(`${GREEN}Metrics: ${baseUrl}/metrics${NC}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});