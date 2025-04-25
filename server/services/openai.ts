import OpenAI from "openai";
import { config } from "../config";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || config.OPENAI_API_KEY,
});

/**
 * Generate content using OpenAI GPT-4o
 * @param topic The topic to generate content about
 * @param wordCount Target word count for the content
 * @returns Generated content and API usage cost in cents
 */
export async function generateContent(
  topic: string,
  wordCount: number
): Promise<{ content: string; cost: number }> {
  try {
    // Prepare system prompt
    const systemPrompt = `You are an SEO copywriter. Generate content based on the user's topic and word count.
     Create well-structured, engaging content that is optimized for search engines while still being valuable to readers.
     Use headings, paragraphs, and bullet points where appropriate.
     The content should be approximately ${wordCount} words in length.`;

    // Prepare user prompt
    const userPrompt = `Topic: ${topic}
     Target word count: ${wordCount} words
     Please create SEO-optimized content on this topic. Include a compelling title, introduction, several sections with subheadings, and a conclusion.`;

    // Make the API call to gpt-4o
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: wordCount * 2, // Estimate of tokens needed (words ≈ tokens/1.5)
    });

    // Calculate the cost based on token usage
    // GPT-4o pricing: $0.01 per 1K input tokens, $0.03 per 1K output tokens
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    
    const inputCost = (inputTokens / 1000) * 1; // $0.01 per 1K input tokens
    const outputCost = (outputTokens / 1000) * 3; // $0.03 per 1K output tokens
    const totalCost = (inputCost + outputCost) * 100; // Convert to cents
    
    // Return the generated content and the cost
    return {
      content: response.choices[0].message.content || "",
      cost: Math.round(totalCost), // Round to nearest cent
    };
  } catch (error) {
    console.error("Error generating content with OpenAI:", error);
    throw new Error(`Content generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
