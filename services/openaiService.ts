import OpenAI from 'openai';
import { ApiKeyStatus } from '../types';

class OpenAIService {
    private client: OpenAI | null = null;
    public status: ApiKeyStatus = 'NOT_SET';

    async initialize(apiKey: string): Promise<boolean> {
        if (!apiKey) {
            this.client = null;
            this.status = 'NOT_SET';
            return false;
        }

        this.status = 'VALIDATING';
        this.client = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
        });

        try {
            // The `list` method does not take a `limit` parameter directly.
            // A simple call is sufficient to validate the API key.
            await this.client.models.list();
            this.status = 'VALID';
            console.log("OpenAI API Key is valid and client is initialized.");
            return true;
        } catch (error) {
            console.error("OpenAI API Key validation failed:", error);
            this.client = null;
            this.status = 'INVALID';
            return false;
        }
    }

    private getClient(): OpenAI {
        if (!this.client || this.status !== 'VALID') {
            throw new Error("OpenAI Service is not initialized or the API key is invalid. Please set a valid key in the Settings tab.");
        }
        return this.client;
    }

    public async sendOpenAiCliPrompt(prompt: string): Promise<string> {
        if (prompt.trim().toLowerCase() === '/help') {
            return `OpenAI CLI Help:
- This terminal is connected to the OpenAI API (model: gpt-4o-mini).
- A valid API key must be configured in the SETTINGS tab to use this feature.
- Enter any prompt to interact with the model.
- Example: "Write a small python function to reverse a string"`;
        }
        
        const openai = this.getClient();
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
            });
            return response.choices[0]?.message?.content ?? "No response from OpenAI.";
        } catch (error) {
            console.error("OpenAI API Error:", error);
            const errorMessage = (error instanceof Error) ? error.message : "Unknown error";
            throw new Error(`Failed to get response from OpenAI. Details: ${errorMessage}`);
        }
    }

    public async createContainer(name: string): Promise<string> {
        const openai = this.getClient();
        try {
            const response = await openai.post('/containers', {
                body: { name },
            });
            return `Container created successfully.\n${JSON.stringify(response, null, 2)}`;
        } catch (error) {
            console.error("OpenAI API Error (createContainer):", error);
            const errorMessage = (error instanceof Error) ? error.message : "Unknown error";
            throw new Error(`Failed to create container. Details: ${errorMessage}`);
        }
    }
}

export const openAIService = new OpenAIService();