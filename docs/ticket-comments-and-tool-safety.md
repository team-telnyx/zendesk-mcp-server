# Ticket Comments & Tool Safety Classification Design Guide

## Overview

This document describes the design and implementation approach for two key features in the Zendesk MCP Server:

1. **Ticket Comments Support**: Comprehensive tools for accessing ticket comments (both public and private) with clear visibility indicators
2. **Tool Safety Classification**: Automatic classification and discovery mechanisms for identifying risky vs safe tools

These features were developed to support AI agents (like Mimir Copilot) that need to:
- Access complete ticket history including comments
- Understand which operations are safe to perform vs which require caution
- Make informed decisions about tool usage before execution

---

## Part 1: Ticket Comments Feature

### Background

The original requirement was to add a simple `list_ticket_comments` tool. However, through implementation and testing, we identified several critical needs for AI agents:

1. **Visibility Clarity**: Agents need to clearly distinguish between public and private comments
2. **Pagination Support**: Large tickets can have many comments that exceed response size limits
3. **Complete Context**: Agents need access to all comments, not just truncated responses
4. **Author Context**: Understanding who wrote each comment (customer vs agent) is crucial for analysis

### Implementation Approach

We implemented a **suite of complementary tools** rather than a single tool, each serving a specific purpose:

#### 1. `list_ticket_comments` - Paginated Comment Listing

**Purpose**: List comments with pagination support and clear visibility indicators.

**Key Features**:
- Supports pagination via `page`, `per_page`, and `sort_order` parameters
- **Formatted output** that makes public/private status immediately obvious:
  - 🔓 PUBLIC / 🔒 PRIVATE indicators for each comment
  - Summary showing total public vs private counts
  - Clear comment structure with all metadata
- Warns when more pages are available

**Design Decision**: We chose formatted output over raw JSON because:
- AI agents need clear, human-readable indicators (🔓/🔒) rather than parsing boolean fields
- The formatted output prevents truncation issues by clearly showing what's in each page
- Summary statistics help agents understand the comment distribution at a glance

**Key Features (Enhanced)**:
- **Attachment URLs**: Shows actual download links for attachments (🔗 URL field)
- Each attachment displays filename, content type, and direct download link

**Example Output**:
```
=== TICKET 2482954 COMMENTS ===

Total comments in this page: 6
Public: 3 | Private: 3

--- Comment 1 [🔓 PUBLIC] ---
ID: 31777969254557
Public: true
Author ID: 387575907018
Created: 2025-11-14T01:23:13Z
Body: Customer has reported an intermittent issue...

=== ATTACHMENTS (1) ===
1. Screenshot 2025-05-01 at 12.56.36 PM.png (image/png)
   🔗 URL: https://telnyx.zendesk.com/attachments/...
```

#### 2. `count_ticket_comments` - Total Comment Count

**Purpose**: Get the total number of comments to determine pagination needs.

**Key Features**:
- Returns total comment count from Zendesk API
- Provides guidance on pagination (e.g., "per_page=10 means you'll need 1 pages")
- Helps agents plan their data fetching strategy

**Design Decision**: Separate count tool because:
- Agents need to know total count before fetching to plan pagination
- Reduces unnecessary API calls when agents just need the count
- Provides clear guidance on how to structure pagination requests

#### 3. `get_ticket_comment` - Individual Comment Access

**Purpose**: Fetch a specific comment by ID with full details.

**Key Features**:
- Direct access to a specific comment
- Clear public/private status
- Full comment metadata
- **Attachment URLs**: Shows actual download links for attachments

**Design Decision**: Individual comment access enables:
- Agents to fetch specific comments referenced in other contexts
- Efficient access when comment IDs are known
- Detailed inspection of particular comments
- Direct access to attachment files via URLs

#### 4. `summarize_ticket_comments` - Comprehensive Summary

**Purpose**: Automatically fetch all comments across multiple pages and provide a comprehensive summary.

**Key Features**:
- **Automatic pagination**: Fetches all comments across all pages automatically
- **Author classification**: Identifies customer vs agent comments
- **Visibility summary**: Counts of public/private comments
- **Complete listing**: All comments with visibility and author type indicators
- **Configurable limits**: `max_comments` parameter to prevent excessive fetching

**Design Decision**: This tool addresses the core AI agent need:
- Agents often need ALL comments, not just one page
- Manual pagination is error-prone for agents
- The summary format provides both overview and detail
- Author classification (👤 CUSTOMER vs 👨‍💼 AGENT) helps agents understand context

**Key Features (Enhanced)**:
- **Attachment URLs**: Shows actual download links for attachments in the summary

**Example Output**:
```
=== TICKET 2482954 COMMENT SUMMARY ===

Total comments fetched: 6 of 6
🔓 Public comments: 3
🔒 Private comments: 3
👤 Customer comments: 1
👨‍💼 Agent comments: 5

=== ALL COMMENTS ===

1. [🔓 PUBLIC] 👤 CUSTOMER | Christian Ebio (cebio@cisco.com) | Role: end-user
   Comment ID: 31777969254557 | Created: 2025-11-14T01:23:13Z
   Preview: Customer has reported an intermittent issue...
   📎 Attachments: 1 file(s)
      1. screenshot.png - 🔗 https://telnyx.zendesk.com/attachments/...

2. [🔒 PRIVATE] 👨‍💼 AGENT | AI Integrations Squad | Role: admin
   Comment ID: 31777977882653 | Created: 2025-11-14T01:23:13Z
   Preview: Internal investigation notes...
```

### Enhanced Ticket Information

#### `get_ticket` - Human-Readable Names

**Purpose**: Get ticket details with human-readable names instead of just IDs.

**Key Features**:
- **Automatic name resolution**: Fetches and displays names for requester, assignee, and group
- Shows requester name, email, and role instead of just ID
- Shows assignee name, email, and role instead of just ID
- Shows group name instead of just ID
- Optional `include_names` parameter (default: `true`) to skip name fetching if needed
- Graceful fallback to IDs if name fetching fails

**Example Output**:
```
=== TICKET 2159052 ===

Subject: TN 7135221717 failing campaign attachment to CHAUKY9
Status: closed
Priority: high
Created: 2025-05-01T18:57:28Z
Updated: 2025-05-01T18:57:28Z

Requester: Cynthia (cynthia@example.com) | Role: end-user | ID: 11023061953565
Assignee: John Smith (john@example.com) | Role: agent | ID: 9942889876125
Group: Support Team | ID: 360001574751
```

**Design Decision**: Name resolution because:
- AI agents need human-readable information, not just numeric IDs
- Makes ticket information immediately understandable
- Follows the same pattern as comment author information
- Optional parameter allows skipping extra API calls when not needed

### API Integration

All tools use the centralized `zendeskClient` in `src/zendesk-client.js`:

- `listTicketComments(id, params)` - Supports pagination parameters
- `countTicketComments(id)` - Uses Zendesk's `/count` endpoint
- `getTicketComment(ticketId, commentId)` - Direct comment access
- `getTicket(id)` - Ticket details with name resolution
- `getUser(id)` - User details for name resolution
- `getGroup(id)` - Group details for name resolution

**Design Decision**: Centralized client ensures:
- Consistent error handling
- Single point of authentication
- Easier maintenance and updates
- Consistent API interaction patterns

### Output Formatting Philosophy

We chose **formatted, human-readable output** over raw JSON for several reasons:

1. **AI Agent Clarity**: Visual indicators (🔓/🔒, 👤/👨‍💼) are immediately understandable
2. **Truncation Prevention**: Clear structure helps agents understand what data is available
3. **Context Preservation**: Summary statistics provide context even if individual comments are truncated
4. **Error Prevention**: Clear visibility indicators prevent agents from accidentally exposing private information
5. **Human-Readable Names**: Names instead of IDs make information immediately understandable
6. **Actionable Links**: Attachment URLs enable direct access to files

**Key Enhancements**:
- **Attachment URLs**: All comment tools now show `content_url` for each attachment, enabling direct file access
- **Name Resolution**: `get_ticket` automatically fetches and displays names for requester, assignee, and group
- **Consistent Formatting**: All tools follow the same formatting patterns for consistency

However, we also include raw JSON in outputs for agents that need structured data.

---

## Part 2: Tool Safety Classification System

### Background

AI agents need to understand which tools are safe to use (read-only) vs which tools can modify or delete data. Without this context, agents might:
- Accidentally modify or delete data
- Be overly cautious and avoid safe operations
- Make decisions without understanding the risk level

### Design Goals

1. **Automatic Classification**: Tools should be automatically classified based on naming patterns
2. **Clear Indicators**: Tool descriptions should clearly show risk level
3. **Discovery Mechanisms**: Multiple ways for agents to discover tool safety information
4. **No Manual Maintenance**: Classification should work automatically for new tools

### Implementation Approach

#### 1. Automatic Risk Classification

Tools are automatically classified based on their names using pattern matching:

```javascript
function isRiskyTool(toolName) {
  const riskyPatterns = [
    /^create_/,  // Create operations
    /^update_/,  // Update operations
    /^delete_/   // Delete operations
  ];
  return riskyPatterns.some(pattern => pattern.test(toolName));
}
```

**Risk Levels**:
- **HIGH RISK**: Tools starting with `delete_` (permanent data deletion)
- **MODERATE RISK**: Tools starting with `create_` or `update_` (data modification)
- **SAFE**: All other tools (read-only operations)

**Design Decision**: Pattern-based classification because:
- Consistent naming convention makes classification reliable
- No manual maintenance required for new tools
- Clear, predictable rules that agents can understand
- Works automatically as new tools are added

#### 2. Enhanced Tool Descriptions

During tool registration, descriptions are automatically prefixed with risk indicators:

```javascript
const riskInfo = getToolRiskInfo(tool.name, tool.description);
const enhancedDescription = `${riskInfo.prefix}${tool.description}`;
// Result: "✅ SAFE (Read-only): List tickets in Zendesk"
// or: "⚠️ MODERATE RISK: Create a new ticket"
```

**Design Decision**: Prefix descriptions because:
- Agents see risk level immediately when tools are listed
- No additional API calls needed to determine safety
- Clear visual indicators (✅/⚠️) are immediately recognizable
- Works with existing MCP tool discovery mechanisms

#### 3. Tool Categorization Storage

Tools are categorized into arrays during server initialization:

```javascript
const riskyTools = [];
const safeTools = [];

allTools.forEach(tool => {
  const riskInfo = getToolRiskInfo(tool.name, tool.description);
  if (riskInfo.isRisky) {
    riskyTools.push({
      name: tool.name,
      description: tool.description,
      riskLevel: riskInfo.riskLevel
    });
  } else {
    safeTools.push({
      name: tool.name,
      description: tool.description
    });
  }
});
```

**Design Decision**: Pre-categorize tools because:
- Enables fast lookups for tool safety resources
- Supports efficient filtering and listing
- Single source of truth for tool categorization
- No runtime classification overhead

### Discovery Mechanisms

We provide **multiple discovery mechanisms** so agents can find tool safety information in the way that works best for them:

#### 1. Tool Descriptions (Automatic)

Every tool's description includes a risk prefix:
- `✅ SAFE (Read-only): List tickets in Zendesk`
- `⚠️ MODERATE RISK: Create a new ticket`
- `⚠️ HIGH RISK: Delete a macro`

**Usage**: Agents see this automatically when tools are listed via `tools/list`.

#### 2. `list_risky_tools` Tool

A dedicated tool that lists all risky tools with filtering options.

**Features**:
- Filter by risk level: `all`, `high_risk`, `moderate_risk`
- Summary statistics (safe vs risky counts)
- Grouped by risk level (HIGH RISK vs MODERATE RISK)
- Complete list with descriptions

**Example Output**:
```
⚠️ RISKY TOOLS - Modify or Delete Data

📊 Summary:
  ✅ Safe (Read-only) tools: 26
  ⚠️ Risky (Modify/Delete) tools: 20
    - HIGH RISK (delete operations): 2
    - MODERATE RISK (create/update operations): 18

🔴 HIGH RISK (Delete Operations):
  - delete_macro: Delete a macro
  - delete_article: Delete a Help Center article

🟡 MODERATE RISK (Create/Update Operations):
  - create_ticket: Create a new ticket
  - update_ticket: Update an existing ticket
  ...
```

**Design Decision**: Dedicated tool because:
- Agents can query risky tools before executing any operations
- Provides comprehensive overview in one call
- Supports filtering for specific risk levels
- Clear, formatted output with statistics

#### 3. `list_safe_tools` Tool

A dedicated tool that lists all safe (read-only) tools.

**Features**:
- Complete list of all safe tools
- Total count
- All tool descriptions

**Example Output**:
```
✅ SAFE TOOLS - Read-Only Operations

These tools only fetch, list, or read information. They do not modify data.

Total safe tools: 26

=== ALL SAFE TOOLS ===

- list_tickets: List tickets in Zendesk
- get_ticket: Get a specific ticket by ID
- list_ticket_comments: List all comments (public and private)...
...
```

**Design Decision**: Separate safe tools list because:
- Agents can identify all safe operations available
- Helps agents understand what they can do without risk
- Complements the risky tools list
- Useful for planning read-only workflows

#### 4. MCP Resources (`zendesk://tools/{category}`)

Resources provide another discovery mechanism following MCP protocol patterns.

**Available Resources**:
- `zendesk://tools/summary` - Overview of safe vs risky tool counts
- `zendesk://tools/risky` - List of all risky tools
- `zendesk://tools/safe` - List of all safe tools
- `zendesk://tools/all` - Alias for risky tools

**Design Decision**: Resources because:
- Follows MCP protocol patterns for documentation
- Can be discovered via `resources/list`
- Provides alternative access method for different client types
- Supports resource templates for flexible access

**Example Resource Output**:
```
📊 TOOL SAFETY SUMMARY

✅ Safe (Read-only) tools: 26
⚠️ Risky (Modify/Delete) tools: 20
📦 Total tools: 46

Use zendesk://tools/risky to see all risky tools
Use zendesk://tools/safe to see all safe tools
```

### Why Multiple Discovery Mechanisms?

We provide multiple ways to discover tool safety information because:

1. **Different Agent Preferences**: Some agents prefer tools, others prefer resources
2. **Different Use Cases**: 
   - Quick check: Use tool descriptions
   - Comprehensive review: Use `list_risky_tools`
   - Documentation: Use resources
3. **Protocol Flexibility**: Supports both MCP tool calls and resource access
4. **Redundancy**: If one mechanism fails, others are available

### Integration with Code Review

The `.ai-code-review-config.yml` file enforces that:
- All new tools are automatically classified
- Tool descriptions must be clear about functionality
- Risk classification is verified during code review
- Documentation is updated when tools are added

This ensures the system remains consistent as new tools are added.

---

## Design Principles

### 1. AI Agent First

All design decisions prioritize AI agent usability:
- Clear, unambiguous indicators (🔓/🔒, ✅/⚠️)
- Formatted output that's easy to parse
- Comprehensive summaries that provide context
- Multiple discovery mechanisms for flexibility

### 2. Automatic Classification

No manual maintenance required:
- Pattern-based risk classification
- Automatic description enhancement
- Pre-categorization during server initialization
- Works automatically for new tools

### 3. Clear Visibility

Nothing is hidden or ambiguous:
- Public/private status is always clear
- Risk levels are always indicated
- Summary statistics provide context
- Warnings when more data is available

### 4. Comprehensive Coverage

Multiple tools for different needs:
- Paginated listing for large datasets
- Count tools for planning
- Summary tools for complete context
- Individual access for specific items

### 5. Protocol Compliance

Follows MCP protocol patterns:
- Tools for executable operations
- Resources for documentation
- Proper error handling
- Standard response formats

---

## Usage Examples

### Example 1: Agent Checking Tool Safety Before Operations

```javascript
// Agent first checks what tools are risky
const riskyTools = await callTool('list_risky_tools', { category: 'all' });

// Agent sees there are 20 risky tools, including:
// - create_ticket (MODERATE RISK)
// - update_ticket (MODERATE RISK)
// - delete_article (HIGH RISK)

// Agent decides to only use safe tools for initial investigation
const safeTools = await callTool('list_safe_tools', {});
// Agent uses: list_tickets, get_ticket, list_ticket_comments (all safe)
```

### Example 2: Agent Analyzing Ticket Comments

```javascript
// Agent gets ticket with human-readable names
const ticket = await callTool('get_ticket', { id: 2159052 });
// Sees: Requester: Cynthia (cynthia@example.com) | Role: end-user
//       Assignee: John Smith (john@example.com) | Role: agent
//       Group: Support Team

// Agent checks comment count
const count = await callTool('count_ticket_comments', { id: 2159052 });
// Result: 13 comments total

// Agent gets comprehensive summary (fetches all comments automatically)
const summary = await callTool('summarize_ticket_comments', {
  id: 2159052,
  include_author_info: true,
  max_comments: 1000
});

// Agent sees:
// - 8 public, 5 private comments
// - All comments with clear visibility and author indicators
// - Attachment URLs for direct file access:
//   "📎 Attachments: 1 file(s)
//      1. Screenshot 2025-05-01 at 12.56.36 PM.png - 🔗 https://telnyx.zendesk.com/attachments/..."

// Agent can now provide accurate analysis without missing context
// Agent can also access attachment files directly via URLs
```

### Example 3: Agent Using Resources for Documentation

```javascript
// Agent discovers resources
const resources = await listResources();

// Agent finds: zendesk://tools/summary
const summary = await readResource('zendesk://tools/summary');
// Gets overview: 26 safe, 20 risky tools

// Agent gets detailed risky tools list
const riskyList = await readResource('zendesk://tools/risky');
// Gets complete list of all risky tools with descriptions
```

---

## Recent Enhancements

### Attachment URLs (Latest)

All comment tools now include direct download links for attachments:
- `list_ticket_comments`: Shows attachment URLs in formatted output
- `get_ticket_comment`: Shows attachment URLs with full details
- `summarize_ticket_comments`: Shows attachment URLs in summary format

**Implementation**: Uses `content_url` field from Zendesk API response, displayed with 🔗 indicator for easy identification.

**Note**: If "Enable secure downloads" is enabled in Zendesk, URLs require authentication (handled automatically by the API token).

### Enhanced `get_ticket` with Names (Latest)

The `get_ticket` tool now automatically fetches and displays human-readable names:
- **Requester**: Shows name, email, and role instead of just ID
- **Assignee**: Shows name, email, and role instead of just ID (or "Unassigned")
- **Group**: Shows group name instead of just ID

**Implementation**: Automatically calls `getUser()` and `getGroup()` APIs when IDs are present, with graceful fallback to IDs if fetching fails.

**Optional Parameter**: `include_names` (default: `true`) allows skipping name resolution to reduce API calls when not needed.

## Future Enhancements

Potential improvements for future iterations:

1. **Tool Usage Analytics**: Track which tools are used most frequently
2. **Risk Confirmation**: Require explicit confirmation for HIGH RISK operations
3. **Custom Risk Levels**: Allow tools to specify custom risk levels if needed
4. **Tool Dependencies**: Document which tools depend on others
5. **Rate Limiting Warnings**: Indicate tools that may be rate-limited
6. **Cost Indicators**: Show which operations have API cost implications
7. **Organization Name Resolution**: Include organization names in ticket output (similar to requester/assignee)
8. **Attachment Preview**: Provide thumbnail or preview URLs for image attachments

---

## Conclusion

The ticket comments feature and tool safety classification system work together to provide AI agents with:

1. **Complete Context**: Access to all ticket comments with clear visibility indicators
2. **Risk Awareness**: Automatic classification and multiple discovery mechanisms
3. **Informed Decisions**: Clear information about tool safety before execution
4. **Flexible Access**: Multiple tools and resources for different use cases

This design ensures that AI agents can safely and effectively interact with the Zendesk API while understanding the implications of their actions.

