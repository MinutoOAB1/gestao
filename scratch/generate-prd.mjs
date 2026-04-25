import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@testsprite/testsprite-mcp@latest"],
    env: {
      ...process.env,
      API_KEY: "sk-user-wzczV0JioCRer3xEAWcyQpeKCLLAyLGXZV9i11hYV0Eq12qy6nk7DWmJT6k9oRrY9acuRV3mpMGetUxV3cIyYek3E-mpIbKRb3Aor9bXPPEvhKaGSv9iRq766A7EDeD0W6Y"
    }
  });

  const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  console.log("Connected to TestSprite MCP server");

  try {
    const result = await client.request({
      method: "tools/call",
      params: {
        name: "testsprite_generate_standardized_prd",
        arguments: {
          projectPath: "c:/Users/victo/OneDrive/Documentos/Antigravi-platadv"
        }
      }
    }, CallToolResultSchema, { timeout: 900000 });
    
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("PRD generation error or timeout:", err);
  } finally {
    await transport.close();
  }
}

main().catch(console.error);
