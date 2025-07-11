

import { GoogleGenAI, Type } from "@google/genai";
import { Project } from '../types';

// Ensure the API key is handled securely and not exposed in the client-side code.
// This uses an environment variable, which is the required practice.
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const emailResponseSchema = {
    type: Type.OBJECT,
    properties: {
        subject: { type: Type.STRING },
        body: { type: Type.STRING },
    },
    required: ['subject', 'body'],
};

/**
 * Generates text content based on a given prompt.
 * @param prompt The text prompt to send to the model.
 * @returns The generated text as a string.
 */
export const generateText = async (prompt: string): Promise<string> => {
    if(!apiKey) throw new Error("API Key is not configured.");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                // Keep default thinking for higher quality
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating text:", error);
        throw new Error("Failed to generate text from AI.");
    }
};

/**
 * Generates an image based on a given prompt.
 * @param prompt The text prompt describing the image to generate.
 * @returns A base64-encoded string of the generated PNG image.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    if(!apiKey) throw new Error("API Key is not configured.");
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });
        
        const base64ImageBytes = response.generatedImages[0]?.image?.imageBytes;
        if (!base64ImageBytes) {
            throw new Error("No image data received from API.");
        }
        return `data:image/png;base64,${base64ImageBytes}`;

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image from AI.");
    }
};

/**
 * Generates a list of ideas based on a given topic.
 * @param topic The topic to brainstorm ideas for.
 * @returns An array of strings, where each string is a generated idea.
 */
export const generateIdeas = async (topic: string): Promise<string[]> => {
    if(!apiKey) throw new Error("API Key is not configured.");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Brainstorm a list of creative ideas related to: "${topic}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ideas: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                            },
                        },
                    },
                },
            },
        });

        const jsonStr = response.text.trim();
        const parsed = JSON.parse(jsonStr);
        return parsed.ideas || [];

    } catch (error) {
        console.error("Error generating ideas:", error);
        throw new Error("Failed to generate ideas from AI.");
    }
};


export const generateLoginAlertEmail = async (loggedInUserName: string, adminName: string): Promise<{ subject: string; body: string; }> => {
    if (!apiKey) throw new Error("API Key is not configured.");
    const prompt = `You are an AI assistant for Kazi Flow. Your name is Kazi.
    Generate a concise email notification for an admin named ${adminName}.
    Inform them that a team member, ${loggedInUserName}, has just logged into the Kazi Flow platform.
    The tone should be professional, brief, and informative, like a personal secretary's note.
    Return the response as a JSON object with "subject" and "body" keys. The body should be plain text.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: emailResponseSchema,
            },
        });
        const json = JSON.parse(response.text);
        return { subject: json.subject, body: json.body };
    } catch (error) {
        console.error("Error generating login alert email:", error);
        return { subject: "Login Alert", body: `Hi ${adminName},\n\nThis is a notification that team member ${loggedInUserName} has just logged into Kazi Flow.\n\nBest,\nKazi Flow Assistant` };
    }
}

export const generateProgressUpdateEmail = async (project: Project, stakeholderName: string): Promise<{ subject: string; body: string; }> => {
    if (!apiKey) throw new Error("API Key is not configured.");
    const lastCompletedTask = project.tasks.filter(t => t.completed).slice(-1)[0];
    const prompt = `You are an AI assistant for Kazi Flow. Your name is Kazi.
    Generate a project progress update email for a project stakeholder named ${stakeholderName}.
    The project is "${project.name}". It has just reached ${project.completion}% completion.
    The most recently completed task was "${lastCompletedTask?.text || 'initial setup'}".
    The tone should be a positive and informative summary. Start the body with "Good news!".
    Return the response as a JSON object with "subject" and "body" keys. The body should be plain text.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: emailResponseSchema,
            },
        });
        const json = JSON.parse(response.text);
        return { subject: json.subject, body: json.body };
    } catch (error) {
        console.error("Error generating progress update email:", error);
        return { 
            subject: `Project Update: ${project.name} is now ${project.completion}% complete`, 
            body: `Hi ${stakeholderName},\n\nThis is an automated update from Kazi Flow.\n\nThe project "${project.name}" has now reached ${project.completion}% completion.\n\nBest,\nKazi Flow Assistant`
        };
    }
}
