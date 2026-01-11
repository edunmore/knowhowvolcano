import OpenAI from "openai";
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Load API key
const apiKeysPath = join(process.cwd(), 'api-keys.json');
const keys = JSON.parse(readFileSync(apiKeysPath, 'utf-8'));
const apiKey = keys.azure.apiKey;

const endpoint = "https://aineu-marcus.cognitiveservices.azure.com/openai/v1/";
const modelName = "gpt-5-nano";
const deployment_name = "gpt-5-nano";

const client = new OpenAI({
    baseURL: endpoint,
    apiKey: apiKey
});

async function main() {
    console.log('Testing Azure GPT-5-nano with correct API setup...\n');

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: "developer", content: "You are a JSON classifier. Output only valid JSON." },
                { role: "user", content: "Classify this as core or skip: 'Chapter 1: Introduction to AI'" }
            ],
            model: deployment_name,
        });

        console.log('✅ Success!');
        console.log('Response:', completion.choices[0]);
        console.log('\nUsage:', completion.usage);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

main();
