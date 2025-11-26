import { z } from 'zod';
    import { zendeskClient } from '../zendesk-client.js';

    export const talkTools = [
      {
        name: "get_talk_stats",
        description: "Get Zendesk Talk statistics. Returns comprehensive Talk metrics and statistics. This is a read-only operation that fetches current Talk system statistics.",
        schema: {},
        handler: async () => {
          try {
            const result = await zendeskClient.getTalkStats();
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error getting Talk stats: ${error.message}` }],
              isError: true
            };
          }
        }
      }
    ];
