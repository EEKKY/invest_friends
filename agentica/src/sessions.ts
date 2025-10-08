import { Agentica } from "@agentica/core";
import OpenAI from "openai";

const sessions = new Map<string, Agentica<any>>();

export function getAgent(key: string) {
  if (!sessions.has(key)) {
    const agent = new Agentica({
      model: "chatgpt",
      vendor: {
        api: new OpenAI({
          apiKey: process.env.OPENAI_API_KEY!,
        }),
        model: "gpt-4o-mini",
      },

      controllers: [],
    });

    sessions.set(key, agent);
  }

  return sessions.get(key);
}