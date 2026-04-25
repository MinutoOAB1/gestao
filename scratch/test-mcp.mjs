import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@testsprite/testsprite-mcp@latest"],
    env: {
      ...process.env,
      API_KEY: "sk-user-FlSCQID4a2UckwK5vBTvwYd2-behYYZ36UZrua4KM-UBEtohzfy8CTN8SpZrFWoOwz8Y9hu8Z97tY6-DOIfvqLu-RuZ1hA4fwkh_NHsFlUPYnFFT2qAfvzwr18tvVvPShEU"
    }
  });

  const client = new Client({
    name: "test-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  await client.connect(transport);
  console.log("Connected to TestSprite MCP server");

  const tools = await client.listTools();
  console.log("Available tools:", JSON.stringify(tools, null, 2));

  await transport.close();
}

main().catch(console.error);
