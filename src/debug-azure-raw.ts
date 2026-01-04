
import { OpenAI } from "openai";
import { readFileSync } from "node:fs";

async function main() {
    console.log("Reading API Key...");
    let apiKey = process.env.AZURE_OPENAI_API_KEY;

    try {
        const keys = JSON.parse(readFileSync("api-keys.json", "utf-8"));
        if (keys.azure?.apiKey) apiKey = keys.azure.apiKey;
    } catch (e) {
        console.log("No api-keys.json found, checking env");
    }

    if (!apiKey) {
        console.error("No API Key found!");
        process.exit(1);
    }

    const deployment = "gpt-5.2-chat";
    const apiVersion = "2024-12-01-preview";
    const endpoint = "https://aineu-marcus.cognitiveservices.azure.com/";

    // Construct the URL manually to verify
    // Standard Azure pattern: https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version={version}
    const baseURL = `${endpoint}openai/deployments/${deployment}`;

    console.log(`Config:`);
    console.log(`  Base URL: ${baseURL}`);
    console.log(`  API Version: ${apiVersion}`);
    console.log(`  Key: ${apiKey.slice(0, 5)}...`);

    console.log("\nInitializing OpenAI client...");

    // Verify if we can connect using standard OpenAI client tailored for Azure
    const client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL,
        defaultQuery: { "api-version": apiVersion },
        defaultHeaders: { "api-key": apiKey }
    });

    try {
        console.log("Sending request...");
        const result = await client.chat.completions.create({
            model: deployment,
            messages: [{ role: "user", content: "Hello, are you working?" }],
            max_tokens: 10
        });

        console.log("\nSUCCESS!");
        console.log("Response:", result.choices[0].message.content);
    } catch (err: any) {
        console.error("\nFAILED");
        console.error("Error Name:", err.name);
        console.error("Error Message:", err.message);
        if (err.response) {
            console.error("Status:", err.status);
            console.error("Headers:", err.response.headers);
        }
    }
}

main();
