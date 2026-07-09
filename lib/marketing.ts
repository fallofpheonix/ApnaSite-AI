import Anthropic from "@anthropic-ai/sdk";
import type { StorefrontData } from "./types";

const client = new Anthropic({ timeout: 30_000, maxRetries: 2 });

export async function generateAdCopy(
  data: StorefrontData,
  platform: string
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Write a short, punchy ad copy for a ${data.category} business called "${data.shopName}" on ${platform}. Tagline: "${data.tagline}". About: ${data.aboutText}. Return ONLY the ad copy text, nothing else.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : "";
}

export async function generateEmailCampaign(
  data: StorefrontData,
  goal: string
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `Write a marketing email campaign for a ${data.category} business called "${data.shopName}". Goal: ${goal}. Tagline: "${data.tagline}". About: ${data.aboutText}. Include a subject line and body. Return ONLY the email content, nothing else.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : "";
}

export async function generateSocialPost(
  data: StorefrontData,
  platform: string
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Write a social media post for a ${data.category} business called "${data.shopName}" on ${platform}. Tagline: "${data.tagline}". About: ${data.aboutText}. Include relevant hashtags. Return ONLY the post text, nothing else.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : "";
}
