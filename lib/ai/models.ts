import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

// Define available models
export const models = {
    'gpt-4o': openai('gpt-4o'),
    'gpt-4o-mini': openai('gpt-4o-mini'),
    'gemini-2.0-flash': google('gemini-2.0-flash'),
    'gemini-1.5-flash': google('gemini-1.5-flash-latest'),
};

// Configuration: Select the active model here
export const activeModelKey = 'gpt-4o-mini'; // Change this string to switch models globally

export const myProvider = models[activeModelKey];

export const getModelName = () => activeModelKey;
