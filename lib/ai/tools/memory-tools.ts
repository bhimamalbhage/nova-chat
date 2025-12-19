import { supermemoryTools } from '@supermemory/tools/ai-sdk';

/**
 * Creates the Supermemory tools instance for the AI SDK.
 * @param supermemoryApiKey The API key for Supermemory.
 * @param containerTag (Optional) Tag to filter/scope the memories.
 */
export function createMemoryTools(supermemoryApiKey: string, containerTag: string = "nova-chat") {
    return supermemoryTools(supermemoryApiKey, {
        containerTags: [containerTag]
    });
}
