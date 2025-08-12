#!/usr/bin/env node

/**
 * Test script to verify MCP server tools are accessible
 * Tests both stdio and HTTP transports
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function testStdioTransport() {
  console.log('🔍 Testing stdio transport...');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['src/index.js']
  });
  
  const client = new Client({
    name: 'MCP Test Client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });
  
  try {
    await client.connect(transport);
    console.log('✅ Connected via stdio');
    
    // List available tools
    const tools = await client.listTools();
    console.log(`✅ Found ${tools.tools.length} tools:`, tools.tools.map(t => t.name).slice(0, 5), '...');
    
    // Test if we can call tools/list
    console.log('✅ Tools accessible via stdio transport');
    
    await client.close();
  } catch (error) {
    console.error('❌ Stdio transport failed:', error.message);
  }
}

async function testHttpTransport() {
  console.log('\n🌐 Testing Streamable HTTP transport...');
  
  const transport = new StreamableHTTPClientTransport(new URL('http://localhost:3000/mcp'));
  
  const client = new Client({
    name: 'MCP Test Client HTTP',
    version: '1.0.0'
  }, {
    capabilities: {}
  });
  
  try {
    await client.connect(transport);
    console.log('✅ Connected via Streamable HTTP');
    
    // List available tools
    const tools = await client.listTools();
    console.log(`✅ Found ${tools.tools.length} tools:`, tools.tools.map(t => t.name).slice(0, 5), '...');
    
    console.log('✅ Tools accessible via Streamable HTTP transport');
    
    await client.close();
  } catch (error) {
    console.error('❌ Streamable HTTP transport failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Testing MCP Server Tool Accessibility\n');
  
  // Test stdio transport
  await testStdioTransport();
  
  // Test HTTP transport (need to start server separately)
  console.log('\n📝 For HTTP testing, start server with: npm run start:http');
  console.log('Then run: node test-mcp.js http\n');
  
  if (process.argv[2] === 'http') {
    await testHttpTransport();
  }
}

main().catch(console.error);